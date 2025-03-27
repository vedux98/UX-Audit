from django.db import models

class Work(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='works/', null=True, blank=True)
    video = models.FileField(upload_to='works_videos/', null=True, blank=True)

    def __str__(self):
        return self.title

class About(models.Model):
    content = models.TextField()

    def __str__(self):
        return "About Section"

class Contact(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()

    def __str__(self):
        return self.name
