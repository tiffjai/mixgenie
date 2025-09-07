export async function sendToServer(message: unknown) {
  const res = await fetch('http://localhost:3001/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function fetchTracksByGenre(genre: string) {
  const res = await fetch('http://localhost:3001/api/tracks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ genre }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}