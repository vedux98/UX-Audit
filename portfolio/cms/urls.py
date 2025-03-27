from django.urls import path
from .views import home, about_view, contact_view

urlpatterns = [
    path('', home, name='home'),
    path('about/', about_view, name='about'),
    path('contact/', contact_view, name='contact'),
]
