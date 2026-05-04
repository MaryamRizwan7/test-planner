import sys
import json
import re
import collections

import nltk
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('punkt_tab', quiet=True)

from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords


def generate_summary(schedule_rows, program):
    if not schedule_rows:
        return "No schedule data available."

    #Build source text from schedule rows 
    sentences_source = []
    for row in schedule_rows:
        day       = row.get("Day", "N/A")
        time      = row.get("Time", "N/A")
        venue     = row.get("Venue", "N/A")
        dept      = row.get("Department", "N/A")
        roll      = row.get("Roll No", "N/A")
        invig     = row.get("Invigilator", "N/A")
        sentence  = (
            f"On {day}, during {time}, venue {venue} in {dept} "
            f"hosted roll numbers {roll} with invigilator {invig}."
        )
        sentences_source.append(sentence)

    source_text = " ".join(sentences_source)

    # NLP Extractive Summarization

    # Tokenize into sentences
    sentences = sent_tokenize(source_text)

    # Tokenize into words, lowercase
    words = word_tokenize(source_text.lower())

    # Remove stop words and non-alphanumeric tokens
    stop_words = set(stopwords.words("english"))
    filtered_words = [w for w in words if w.isalnum() and w not in stop_words]

    # Compute word frequencies
    freq = collections.Counter(filtered_words)

    # Normalize by max frequency
    max_freq = max(freq.values()) if freq else 1
    for word in freq:
        freq[word] = freq[word] / max_freq

    # Score each sentence by summing normalized word frequencies
    sentence_scores = {}
    for sent in sentences:
        for word in word_tokenize(sent.lower()):
            if word in freq:
                sentence_scores[sent] = sentence_scores.get(sent, 0) + freq[word]

    # Select top N sentences (preserving original order)
    n = max(3, len(sentences) // 5)
    top_sentences = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:n]
    ordered_summary = [s for s in sentences if s in top_sentences]
    nlp_summary = " ".join(ordered_summary)

    # Compute stats directly from schedule
    unique_venues      = set(r.get("Venue", "") for r in schedule_rows)
    unique_invigilators = set(r.get("Invigilator", "") for r in schedule_rows if r.get("Invigilator"))
    unique_days        = set(r.get("Day", "") for r in schedule_rows)
    unique_shifts      = set(r.get("Time", "") for r in schedule_rows)

    total_rows         = len(schedule_rows)
    unique_venues      = len(unique_venues)
    unique_invigilators = len(unique_invigilators)
    unique_days_count  = len(unique_days)
    unique_shifts_count = len(unique_shifts)

    # Build final output 
    header = (
        f"[{program.upper()} PROGRAM] Exam Schedule Summary "
        f"({total_rows} session slots | {unique_days_count} day(s) | "
        f"{unique_shifts_count} shift(s) | {unique_venues} venue(s) | "
        f"{unique_invigilators} invigilator(s))\n\n"
    )

    return header + nlp_summary


if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        schedule = data.get("schedule", [])
        program  = data.get("program", "bachelor")
        result   = generate_summary(schedule, program)
        print(result)
    except Exception as e:
        print("Summary unavailable.")
        sys.exit(1)