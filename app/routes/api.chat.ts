import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { chatAction } from '~/lib/.server/chat/handler';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}
