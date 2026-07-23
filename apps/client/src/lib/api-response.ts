export async function throwResponseError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  let message = fallbackMessage;

  try {
    const body: unknown = await response.clone().json();

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      message = body.error;
    }
  } catch {
    // Infrastructure failures may return an empty or non-JSON response.
  }

  throw new Error(message);
}
