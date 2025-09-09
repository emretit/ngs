
import { ServiceMutationsResult } from "./types";
import { useServiceCrudMutations } from "./mutations/useServiceCrudMutations";
import { useDeleteServiceMutation } from "./mutations/useDeleteServiceMutation";
import { useAttachmentMutations } from "./mutations/useAttachmentMutations";

export const useServiceMutations = (): ServiceMutationsResult => {
  const crudMutations = useServiceCrudMutations();
  const deleteMutation = useDeleteServiceMutation();
  const attachmentMutations = useAttachmentMutations();

  return {
    ...crudMutations,
    ...deleteMutation,
    ...attachmentMutations
  };
};
