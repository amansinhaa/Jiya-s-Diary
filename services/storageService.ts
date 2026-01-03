const BUCKET_NAME = 'jiyav-73e4b.firebasestorage.app';
const BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o`;

// Helper to generate a unique ID for the board
const generateId = () => {
  return 'board_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

// Helper to handle API errors
const handleApiError = async (response: Response, action: string) => {
  let errorMessage = `${action} failed. Status: ${response.status}`;
  try {
    const errorBody = await response.text();
    const errorJson = JSON.parse(errorBody);
    if (errorJson.error && errorJson.error.message) {
      errorMessage += `. Details: ${errorJson.error.message}`;
    }
  } catch (e) {
    // Could not parse JSON, use raw text or default message
  }

  if (response.status === 403) {
    throw new Error(`Permission Denied (403). Check Firebase Rules.`);
  }
  
  throw new Error(errorMessage);
};

export const createCloudBoard = async (data: any): Promise<string> => {
  const id = generateId();
  try {
    const payload = JSON.stringify(data);
    const encodedId = encodeURIComponent(id);
    
    const response = await fetch(`${BASE_URL}?uploadType=media&name=${encodedId}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload
    });

    if (!response.ok) {
      await handleApiError(response, 'Create Board');
    }
    
    return id;
  } catch (error) {
    throw error;
  }
};

export const updateCloudBoard = async (id: string, data: any): Promise<void> => {
  try {
    const payload = JSON.stringify(data);
    const encodedId = encodeURIComponent(id);

    const response = await fetch(`${BASE_URL}?uploadType=media&name=${encodedId}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload
    });

    if (!response.ok) {
      await handleApiError(response, 'Update Board');
    }
  } catch (error) {
    throw error;
  }
};

export const getCloudBoard = async (id: string): Promise<any> => {
  try {
    const timestamp = new Date().getTime();
    const encodedId = encodeURIComponent(id);
    
    const response = await fetch(`${BASE_URL}/${encodedId}?alt=media&t=${timestamp}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error('Board not found');
      await handleApiError(response, 'Fetch Board');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const uploadMedia = async (file: File): Promise<string> => {
  const fileName = `img_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const encodedName = encodeURIComponent(fileName);
  
  try {
    const response = await fetch(`${BASE_URL}?uploadType=media&name=${encodedName}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': file.type,
      },
      body: file
    });

    if (!response.ok) {
      await handleApiError(response, 'Upload Image');
    }

    const data = await response.json();
    const token = data.downloadTokens ? `&token=${data.downloadTokens.split(',')[0]}` : '';
    const publicUrl = `${BASE_URL}/${encodedName}?alt=media${token}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Image Upload Error:', error);
    throw error;
  }
};