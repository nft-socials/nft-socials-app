export interface PostMetadata {
  content: string;
  timestamp: number;
  author: string;
  version: '1.0';
  image?: string; // Base64 encoded image data
}

// NOTE: Uploading to IPFS requires a pinning service. Provide your own endpoint/token.
// Throwing here ensures no silent mock behavior.
export async function storeOnIPFS(metadata: PostMetadata): Promise<string> {

  // WARNING: Using a JWT in client code exposes it to users. Prefer storing in Supabase Edge Function secrets.
  const PINATA_JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxMTc1YTA4MC05MDUxLTQxMDAtOWE2MC1jMDM4YTMyYmZmMzQiLCJlbWFpbCI6InNlZ3VuemFjaGV1c2lAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImJmZjRkYzkwZTJjZmNjNThhOTc1Iiwic2NvcGVkS2V5U2VjcmV0IjoiMzU1ZTM0NTIyOTgzOTEyNDM4OTQ2ZGI5ZDQ2NDcxNzgzNDNmYTcwOGI0ZTk3ZGU5NDNiYjA3YWQ1MDI1ZDk3ZCIsImV4cCI6MTc4NjQ2ODE2MX0.Z8-dQQk1nvzpHvee7AS7jd31TACjQ8dhJ56QO1wezbc';

  // Allow override via runtime for safer usage (e.g., window.PINATA_JWT or localStorage)
  const runtimeJwt = (globalThis as any)?.PINATA_JWT || localStorage.getItem('PINATA_JWT');
  const jwt = runtimeJwt || PINATA_JWT;

  const requestBody = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `opd-post-${metadata.author}-${metadata.timestamp}`,
    },
    pinataOptions: { cidVersion: 1 },
  };


  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('IPFS upload failed:', res.status, errText);
    throw new Error(`Pinata upload failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  return data.IpfsHash;
}

export async function getFromIPFS<T = PostMetadata>(hash: string): Promise<T | null> {
  try {
    const res = await fetch(`https://ipfs.io/ipfs/${hash}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
