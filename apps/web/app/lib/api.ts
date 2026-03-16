const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log("API_URL:", API_URL);
export const api = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  });

 if (!res.ok) {
    const errorText = await res.text();
    let errorObj: any = {};

    try {
      errorObj = JSON.parse(errorText);
    } catch (e) {
      errorObj = { message: errorText }; 
    }

    //console.error(` API Error [Status: ${res.status}]:`, errorObj);

    const extractedError = errorObj.message || errorObj.error || "Something went wrong";
    
    const finalErrorMessage = typeof extractedError === "string" 
      ? extractedError 
      : JSON.stringify(extractedError); 

    throw new Error(finalErrorMessage);
  }

  return res.json();
};