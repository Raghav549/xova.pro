import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';

/** Legacy route kept so old share links keep working. */
export async function loader({ params }: LoaderFunctionArgs) {
  return redirect(`/studio/${params.id}`, { status: 302 });
}

export default function LegacyChatRedirect() {
  return null;
}
