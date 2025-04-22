from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserDataViewSet

router = DefaultRouter()
router.register(r'userdata', UserDataViewSet, basename='userdata')

urlpatterns = [
    path('', include(router.urls)),
    path('userdata/registration/<str:registrationid>/', UserDataViewSet.as_view({'get': 'get_by_registration'}), name='userdata-by-registration'),
    path('userdata/registration/<str:registrationid>', UserDataViewSet.as_view({'get': 'get_by_registration'}), name='userdata-by-registration-no-slash'),
] 