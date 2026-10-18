import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  saveCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
} from '../api/collectionsApi'
import { toast } from '@/shared/ui'

export function useCollectionsMutations(uid: string | undefined) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveCollection(uid, { name, description } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Collection created!')
    },
    onError: () => toast.error('Failed to create collection.'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveCollection(uid, { id, name, description } as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Collection updated!')
    },
    onError: () => toast.error('Failed to update collection.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deleteCollection(uid, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Collection deleted.')
    },
    onError: () => toast.error('Failed to delete collection.'),
  })

  const addItemMutation = useMutation({
    mutationFn: async ({
      collectionId,
      item,
    }: {
      collectionId: string
      item: { titleKey: string; title: string; posterPath: string | null; type: 'movie' | 'tv' }
    }) => {
      if (!uid) throw new Error('Not authenticated')
      return addItemToCollection(uid, collectionId, item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Added to collection!')
    },
    onError: () => toast.error('Failed to add title.'),
  })

  const removeItemMutation = useMutation({
    mutationFn: async ({ collectionId, titleKey }: { collectionId: string; titleKey: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return removeItemFromCollection(uid, collectionId, titleKey)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Removed from collection.')
    },
    onError: () => toast.error('Failed to remove title.'),
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    addItemMutation,
    removeItemMutation,
  }
}
