from django.shortcuts import render
from .models import Work, About

def home(request):
    works = Work.objects.all()
    about = About.objects.first()
    return render(request, 'work.html', {'works': works, 'about': about})

def about_view(request):
    about = About.objects.first()
    return render(request, 'about.html', {'about': about})

def contact_view(request):
    return render(request, 'contact.html')
