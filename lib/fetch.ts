export async function fetcher<T = any>({
  baseUrl,
  path,
  method = 'GET',
  version = 'v1',
  body,
  apiKey,
  ...init
}: {
  baseUrl: string
  path: string
  version?: string
  method?: string
  body?: any
  apiKey: string
}): Promise<T> {
  const response = await fetch(`${baseUrl}/api/${version}${path}`, {
    ...init,
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json() as Promise<T>
}
