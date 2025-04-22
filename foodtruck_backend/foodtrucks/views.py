from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import UserData
from .serializers import UserDataSerializer

class UserDataViewSet(viewsets.ModelViewSet):
    queryset = UserData.objects.all()
    serializer_class = UserDataSerializer
    
    def get_by_registration(self, request, registrationid=None):
        try:
            user = UserData.objects.get(registrationid=registrationid)
            serializer = UserDataSerializer(user)
            return Response(serializer.data)
        except UserData.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 