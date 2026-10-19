import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  Film,
  Sparkles,
  Layers,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useAppStore } from '@/domain/store'
import { computeSmartCollections } from '@/domain/smartCollections'
import { useCollectionsMutations } from '../hooks/useCollectionsMutations'
import type { Collection } from '@/shared/schemas'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { FilterBar } from '@/shared/ui/layout/FilterBar'
import { SearchField } from '@/shared/ui/layout/SearchField'
import { Button } from '@/shared/ui/Button/Button'
import { CollectionCreateModal, CollectionAddTitlesSheet } from './CollectionModals'
import { CollectionDetailView } from './CollectionDetailView'
import { CollectionListSections } from './CollectionListSections'

import './CollectionsPage.css'

export default function CollectionsPage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const { user } = useAuthStore()
  const uid = user?.uid

  const entries = useAppStore((state) => state.library)
  const collections = useAppStore((state) => state.collections)
  const isReady = useAppStore((state) => state.isReady)
  const isLoading = !isReady

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    addItemMutation,
    removeItemMutation,
  } = useCollectionsMutations(uid)

  const activeCollectionId = params.id || null
  const setActiveCollectionId = (id: string | null) => {
    if (id) {
      navigate(`/collections/${id}`)
    } else {
      navigate('/collections')
    }
  }

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddTitlesOpen, setIsAddTitlesOpen] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColDesc, setNewColDesc] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [tabFilter, setTabFilter] = useState<'all' | 'custom' | 'smart'>('all')
  const [colSearch, setColSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const smartCollections = useMemo(() => computeSmartCollections(entries), [entries])

  const activeCollection = useMemo(() => {
    if (!activeCollectionId) return null
    if (activeCollectionId.startsWith('smart:')) {
      return smartCollections.find((c) => c.id === activeCollectionId) || null
    }
    return collections.find((c) => c.id === activeCollectionId) || null
  }, [activeCollectionId, smartCollections, collections])

  const candidateTitles = useMemo(() => {
    if (!activeCollection || 'list' in activeCollection) return []
    const alreadyIn = new Set(((activeCollection as Collection).items ?? []).map((i) => i.titleKey))
    return entries.filter(
      (e) => !alreadyIn.has(e.titleKey) && e.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [activeCollection, entries, searchQuery])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    await createMutation.mutateAsync({
      name: newColName.trim(),
      description: newColDesc.trim(),
    })
    setNewColName('')
    setNewColDesc('')
    setIsCreateOpen(false)
  }

  const handleDelete = async (colId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this collection?')) {
      await deleteMutation.mutateAsync(colId)
      if (activeCollectionId === colId) {
        setActiveCollectionId(null)
      }
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ aspectRatio: '1.4', borderRadius: 'var(--radius-xl, 16px)' }}
            />
          ))}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {activeCollection ? (
        <CollectionDetailView
          activeCollection={activeCollection as any}
          activeCollectionId={activeCollectionId!}
          entries={entries as any}
          onBack={() => setActiveCollectionId(null)}
          onOpenAddTitles={() => setIsAddTitlesOpen(true)}
          onRemoveItem={(titleKey) =>
            removeItemMutation.mutate({
              collectionId: activeCollectionId!,
              titleKey,
            })
          }
          onUpdateName={(name) =>
            updateMutation.mutate({
              id: activeCollectionId!,
              name,
            })
          }
        />
      ) : (
        <div className="col-main-pane animate-fade-in">
          <PageHeader
            eyebrow="CURATED LISTS"
            title="Collections"
            subtitle="Organize your favorite movies and shows into custom lists and smart collections"
            actions={
              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
                New Collection
              </Button>
            }
          >
            <SearchField
              value={colSearch}
              onChange={setColSearch}
              placeholder="Search collections by name or description..."
            />
          </PageHeader>

          <StatRow>
            <StatTile
              icon={<Layers size={22} />}
              value={collections.length + smartCollections.length}
              label="Total Collections"
            />
            <StatTile
              icon={<Film size={22} />}
              value={
                collections.reduce((sum, c) => sum + (c.items?.length || 0), 0) +
                smartCollections.reduce((sum, c) => sum + (c.list.length || 0), 0)
              }
              label="Titles Curated"
            />
            <StatTile
              icon={<Sparkles size={22} />}
              value={smartCollections.length}
              label="Smart Auto-Lists"
            />
          </StatRow>

          <FilterBar
            tabs={[
              { id: 'all', label: 'All Lists', count: collections.length + smartCollections.length },
              { id: 'custom', label: 'Custom Lists', count: collections.length },
              { id: 'smart', label: '⚡ Smart Collections', count: smartCollections.length },
            ]}
            activeTab={tabFilter}
            onTabChange={(id) => setTabFilter(id as any)}
          />

          <CollectionListSections
            tabFilter={tabFilter}
            colSearch={colSearch}
            onClearSearch={() => setColSearch('')}
            smartCollections={smartCollections as any}
            collections={collections as any}
            onSelectCollection={setActiveCollectionId}
            onOpenCreate={() => setIsCreateOpen(true)}
            onDeleteCollection={handleDelete}
            menuOpenId={menuOpenId}
            setMenuOpenId={setMenuOpenId}
          />
        </div>
      )}

      <CollectionCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        name={newColName}
        setName={setNewColName}
        description={newColDesc}
        setDescription={setNewColDesc}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      <CollectionAddTitlesSheet
        isOpen={isAddTitlesOpen}
        onClose={() => {
          setIsAddTitlesOpen(false)
          setSearchQuery('')
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        candidateTitles={candidateTitles as any}
        onAddTitle={(item) =>
          addItemMutation.mutate({
            collectionId: activeCollectionId!,
            item,
          })
        }
      />
    </PageShell>
  )
}
