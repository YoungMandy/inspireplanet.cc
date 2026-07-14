import { http } from '../config/http';
import { ApiResponse } from '../types/http';

export interface CommunityQrData {
  imageUrl: string | null;
  updatedAt: string | null;
}

export const communityQrApi = {
  current: (): Promise<ApiResponse<CommunityQrData>> =>
    http.get<CommunityQrData>('/communityQr', 'current'),

  update: (base64Image: string): Promise<ApiResponse<CommunityQrData>> =>
    http.post<CommunityQrData>('/communityQr', 'update', { base64Image }),
};

export default communityQrApi;
