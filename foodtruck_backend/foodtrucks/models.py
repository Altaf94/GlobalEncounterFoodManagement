from django.db import models

class UserData(models.Model):
    registrationid = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.registrationid})" 