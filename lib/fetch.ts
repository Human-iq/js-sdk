export async function fetcher<T = any>({
  baseUrl,
  path,
  method = 'GET',
  body,
  apiKey,
  ...init
}: {
  baseUrl: string
  path: string
  method?: string
  body?: any
  apiKey: string
}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json() as Promise<T>
}
