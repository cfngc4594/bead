import {
  createTransaction,
  type LocalStorageCollectionUtils,
} from "@tanstack/react-db";

type MutationAcceptor = LocalStorageCollectionUtils["acceptMutations"];

export function commitLocalStorageMutation(
  mutator: () => void,
  ...acceptors: MutationAcceptor[]
) {
  const transaction = createTransaction({
    mutationFn: async ({ transaction: pendingTransaction }) => {
      for (const acceptMutations of acceptors) {
        acceptMutations(pendingTransaction);
      }
    },
  });

  transaction.mutate(mutator);
  return transaction.isPersisted.promise;
}
