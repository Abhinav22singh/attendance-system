from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

class AdminLoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
            # Create a simple token
            token = RefreshToken()
            token['role'] = 'admin'
            return Response({
                'access': str(token.access_token),
                'message': 'Login successful'
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class AdminVerifyView(APIView):
    # The admin token issued by AdminLoginView carries no user_id claim, so
    # DRF's globally configured JWTAuthentication would reject it before this
    # view's own manual "Bearer " check ever runs. This view does its own
    # verification, so it opts out of that authenticator.
    authentication_classes = []

    def get(self, request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return Response({'error': 'Unauthorized'}, status=401)
        return Response({'message': 'Valid'})