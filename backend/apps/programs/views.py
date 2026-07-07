from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EducationProgram
from .serializers import (
    EducationProgramSerializer,
    EducationProgramShortSerializer,
    SubjectSerializer,
)
from .selectors import (
    get_active_programs_queryset,
    get_program_by_code,
    get_subjects_queryset,
)


class ProgramListView(ListAPIView):
    """
    Список активных образовательных программ.

    GET /api/programs/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = EducationProgramShortSerializer

    def get_queryset(self):
        queryset = get_active_programs_queryset()

        school = self.request.query_params.get('school')
        education_level = self.request.query_params.get('education_level')
        study_form = self.request.query_params.get('study_form')
        search = self.request.query_params.get('search')

        if school:
            queryset = queryset.filter(school=school)

        if education_level:
            queryset = queryset.filter(education_level=education_level)

        if study_form:
            queryset = queryset.filter(study_form=study_form)

        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(
                code__icontains=search
            )

        return queryset.order_by('code', 'name')


class ProgramDetailView(RetrieveAPIView):
    """
    Детальная карточка программы по ID.

    GET /api/programs/<id>/
    """

    permission_classes = [IsAuthenticated]
    queryset = EducationProgram.objects.prefetch_related(
        'subject_requirements',
        'subject_requirements__subject',
    )
    serializer_class = EducationProgramSerializer


class ProgramByCodeView(APIView):
    """
    Детальная карточка программы по коду.

    GET /api/programs/by-code/<code>/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        program = get_program_by_code(code)

        if not program:
            return Response(
                {
                    'detail': 'Программа не найдена.',
                },
                status=404,
            )

        serializer = EducationProgramSerializer(program)

        return Response(serializer.data)


class SubjectListView(ListAPIView):
    """
    Список предметов.

    GET /api/subjects/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return get_subjects_queryset()