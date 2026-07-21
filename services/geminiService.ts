// // services/geminiApi.ts
// const baseUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL || 'https://aithon.site.com/nuxes-api';
// interface ReportResponse {
//   report?: string;
//   analysis?: string;
//   forecast?: string;
// }

// const handleResponse = async (res: Response) => {
//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(`API Error: ${res.status} - ${text}`);
//   }
//   return res.json() as Promise<ReportResponse>;
// };

// /**
//  * Generate a business report via Laravel backend.
//  * @param dataContext JSON string representing business data
//  * @param query User's query/request
//  */
// export const generateBusinessReport = async (
//   dataContext: string,
//   query: string
// ): Promise<string> => {
//   try {
//     const res = await fetch('/api/gemini/report', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ dataContext, query }),
//     });

//     const data = await handleResponse(res);
//     return data.report || 'Unable to generate report at this time.';
//   } catch (error) {
//     console.error('Generate Business Report Error:', error);
//     return 'An error occurred while generating the report.';
//   }
// };

// /**
//  * Analyze inventory trends via Laravel backend.
//  * @param inventoryData JSON string representing inventory data
//  */
// export const analyzeInventoryTrends = async (
//   inventoryData: string
// ): Promise<string> => {
//   try {
//     const res = await fetch('/api/gemini/inventory-analysis', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ inventoryData }),
//     });

//     const data = await handleResponse(res);
//     return data.analysis || 'No analysis available.';
//   } catch (error) {
//     console.error('Inventory Analysis Error:', error);
//     return 'Could not analyze inventory.';
//   }
// };

// /**
//  * Predict inventory needs via Laravel backend.
//  * @param inventoryContext JSON string representing historical inventory & sales data
//  */
// export const predictInventoryNeeds = async (
//   inventoryContext: string
// ): Promise<string> => {
//   try {
//     const res = await fetch('/api/gemini/forecast-inventory', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ inventoryContext }),
//     });

//     const data = await handleResponse(res);
//     return data.forecast || 'Forecasting unavailable.';
//   } catch (error) {
//     console.error('Inventory Forecast Error:', error);
//     return 'Unable to generate forecast at this time.';
//   }
// };

// services/geminiApi.ts

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ;

interface ReportResponse {
  report?: string;
  analysis?: string;
  forecast?: string;
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} - ${text}`);
  }
  return res.json() as Promise<ReportResponse>;
};

/**
 * Generate a business report via Laravel backend.
 */
export const generateBusinessReport = async (
  dataContext: string,
  query: string
): Promise<string> => {
  try {
    const res = await fetch(`${baseUrl}/gemini/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ dataContext, query }),
    });

    const data = await handleResponse(res);
    return data.report || 'Unable to generate report at this time.';
  } catch (error) {
    console.error('Generate Business Report Error:', error);
    return 'An error occurred while generating the report.';
  }
};

/**
 * Analyze inventory trends via Laravel backend.
 */
export const analyzeInventoryTrends = async (
  inventoryData: string
): Promise<string> => {
  try {
    const res = await fetch(`${baseUrl}/gemini/inventory-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ inventoryData }),
    });

    const data = await handleResponse(res);
    return data.analysis || 'No analysis available.';
  } catch (error) {
    console.error('Inventory Analysis Error:', error);
    return 'Could not analyze inventory.';
  }
};

/**
 * Predict inventory needs via Laravel backend.
 */
export const predictInventoryNeeds = async (
  inventoryContext: string
): Promise<string> => {
  try {
    const res = await fetch(`${baseUrl}/gemini/forecast-inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ inventoryContext }),
    });

    const data = await handleResponse(res);
    return data.forecast || 'Forecasting unavailable.';
  } catch (error) {
    console.error('Inventory Forecast Error:', error);
    return 'Unable to generate forecast at this time.';
  }
};

