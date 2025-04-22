from rest_framework import serializers
from .models import UserData

class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserData
        fields = ['registrationid', 'type', 'name', 'created_at'] 