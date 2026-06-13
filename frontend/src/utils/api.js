export const API_BASE_URL = 'https://7fwutbh0wh.execute-api.us-east-1.amazonaws.com/Prod';

export const getMediaUploadUrl = async (filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/return/media-url?filename=${encodeURIComponent(filename)}`);
    if (!response.ok) throw new Error('Failed to get media upload URL');
    return await response.json();
  } catch (error) {
    console.error('Error in getMediaUploadUrl:', error);
    throw error;
  }
};

export const uploadMediaToS3 = async (uploadUrl, fileUri, fileType = 'image/jpeg') => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': fileType,
      },
    });
    
    if (!uploadResponse.ok) throw new Error('Failed to upload media to S3');
    return true;
  } catch (error) {
    console.error('Error in uploadMediaToS3:', error);
    throw error;
  }
};

export const submitReturnIntercept = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/return/intercept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to submit return intercept');
    return await response.json();
  } catch (error) {
    console.error('Error in submitReturnIntercept:', error);
    throw error;
  }
};

export const fetchAdminMetrics = async () => {
  // In a real application, this would call a GET /metrics endpoint.
  // The serverless API currently only supports /return/media-url, /return/intercept, /listing, /escrow/lock, /escrow/release, /dpp
  // Since we don't have a /metrics endpoint implemented in the Go API yet, 
  // we will query the listings endpoint or simulate the fetching to represent integration readiness.
  
  // Example dummy fetch simulating a live API call until the metrics endpoint is implemented in Go
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        capitalRecaptured: 42500,
        interceptRate: 34,
        co2Saved: 1420,
        treeEquivalence: 67,
        distanceOffset: 8500
      });
    }, 1000);
  });
};
