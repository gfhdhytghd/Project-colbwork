import { z } from 'zod';

export const PresenceStatus = z.enum(['ONLINE', 'AWAY', 'DND', 'OFFLINE']);
export const WorkLocation = z.enum(['OFFICE', 'REMOTE']);

export const PresenceUpdateSchema = z.object({
  status: PresenceStatus.default('ONLINE'),
  location: WorkLocation.default('REMOTE'),
  deskId: z.string().uuid().nullable().optional(),
});
export type PresenceUpdate = z.infer<typeof PresenceUpdateSchema>;

export const CreateMessageSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1),
  attachments: z.any().optional(),
});
export type CreateMessage = z.infer<typeof CreateMessageSchema>;

export const CreateEventSchema = z.object({
  ownerId: z.string().uuid(),
  title: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'FREEBUSY', 'PUBLIC']).default('FREEBUSY'),
});
export type CreateEvent = z.infer<typeof CreateEventSchema>;
