# 📚 Test Planner Project

A smart and structured **Test Planner Web Application** designed to help organizers and professors in creating, and optimizing their study schedules efficiently. This project focuses on productivity, clarity, and ease of use, making exam scheduling less chaotic and more strategic.

---

## 🚀 Overview

The Test Planner allows users to:

* Divides students to seperate exam venues.
* Assigns each invigilator to a particular block/venue.
* Generates a proper Schedule along with time slots and shifts.
* Generates a Venue plan.

---

## ✨ Features

### 📅 Test Scheduling

* Upload the Invigilators, Students and blocks file.
* Choose the number of days and dates for the conduction of exam.
* Set the shift timings and generate the schedule.

### 📘 Venue Plan generation

* After previewing the scedule click on generate venue plan.
* Preview Venue plan, and download as a Word documemt.

### 🖥️ User-Friendly Interface

* Clean and minimal design
* Easy navigation for better productivity

---

## 🛠️ Tech Stack

### Frontend:

* HTML
* CSS
* JavaScript / React.js

### Backend:

* Django 

### Database:

* PostgreSQL

### Tools:

* Git & GitHub for version control
* VS Code for development

---

## 📂 Project Structure

```
project/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── styles/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│
├── database/
│
├── README.md
└── package.json
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MaryamRizwan7/test-planner.git
cd project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm start
```

Here’s your **properly formatted README section** — clean, structured, and GitHub-ready 📘✨

---

## 🔧 Backend Setup (Django)

### 1. Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate # Mac/Linux
```

### 2. Install Dependencies

```bash
pip install django djangorestframework
```

### 3. Setup Project & App

```bash
django-admin startproject backend
cd backend
python manage.py startapp planner
```

Add the following to `settings.py`:

```python
INSTALLED_APPS = [
    'rest_framework',
    'planner',
]
```

---

### 4. Create Model

```python
from django.db import models

class Test(models.Model):
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    date = models.DateField()
```

---

### 5. Run Project

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

---

### 6. (Optional) API Setup

#### `serializers.py`

```python
from rest_framework import serializers
from .models import Test

class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = '__all__'
```

#### `views.py`

```python
from rest_framework import viewsets
from .models import Test
from .serializers import TestSerializer

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
```

#### `urls.py`

```python
from rest_framework.routers import DefaultRouter
from planner.views import TestViewSet

router = DefaultRouter()
router.register(r'tests', TestViewSet)
```


## 🧪 Usage

1. Simply generate schedule for exams without manually wasting time.
2. Preview and make changes in the schedule right before downloading.
3. Download the complete schedule as an excel file.
4. Generate venue plan.
5. Download venue plan as a word document.

---

## 📸 Screenshots (Optional)

<img width="1365" height="588" alt="landing page" src="https://github.com/user-attachments/assets/c423a3e3-294a-48d4-a216-c5b4c55a9ab1" />
<img width="1140" height="592" alt="MastersInst1" src="https://github.com/user-attachments/assets/267dec8c-339d-4861-b546-aa31f60c9dc2" />
<img width="1090" height="550" alt="MastersInst2" src="https://github.com/user-attachments/assets/ecc13375-0ba8-4058-945c-c988c05673a7" />
<img width="1296" height="597" alt="Masterform" src="https://github.com/user-attachments/assets/38bc579d-7520-4197-b094-511618f5c842" />
<img width="1162" height="600" alt="BachelorsInst1" src="https://github.com/user-attachments/assets/e719ec3d-826a-4a53-9884-dfc0d10b8141" />





---

## 🔮 Future Improvements

* 🔔 Notifications & reminders
* 📈 Analytics dashboard (study insights)
* 👥 Multi-user support
* ☁️ Cloud sync
* 🎯 AI-based schedule adjustments recommendations



---
 License

This project is licensed under the MIT License.

