import type { Question, QuestionFullDetail, QuestionGetReturn, QuestionParagraphReturn, QuestionToCreate, QuestionToUpdate } from "../types/Question";
import { client } from "./authService";

export async function createParagraph(question : QuestionToCreate): Promise<QuestionParagraphReturn> {
    const response = await client.post('/Question', question);
    return response.data;
}

export async function createQuestion(question : QuestionToCreate): Promise<Question> {
    const response = await client.post('/Question', question);
    return response.data;
}

export async function getAllQuestionsWithTestId(testId: number): Promise<Question[]> {
    const response = await client.get(`/Question/bytestid?id=${testId}`);
    return response.data;
}

export async function getQuestion(id: number): Promise<QuestionGetReturn> {
    const response = await client.get(`/Question/${id}`);
    return response.data;
}

export async function deleteQuestion(id: number): Promise<void> {
    await client.delete(`/Question/${id}`);
}

export async function updateQuestion(id: number, question: QuestionToUpdate): Promise<Question> {
    const response = await client.put(`/Question/${id}`, question);
    return response.data;
}

export async function getAllQuestionsAndParagraphsWithTestId(testId: number): Promise<QuestionFullDetail[]> {
    const response = await client.get(`/Question/allquestionsbyid?id=${testId}`);
    return response.data;
}

export async function getQuestionCountInTestId(testId: string): Promise<number> {
    const response = await client.get(`/Question/questioncountintestid?id=${testId}`);
    return response.data;
}

interface UploadQuestionsResponse {
    success: boolean;
    message: string;
    importedCount: number;
}

export async function uploadQuestionsFromFile(testId: number, file: File, testType: string): Promise<UploadQuestionsResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await client.post(`Question/upload-excel?testId=${testId}&testType=${testType}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    
    return response.data;
}
