import { useEffect, useState } from 'react'
import { groupsService } from '../services/api'
import { Group, Membership } from '../types'

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [members, setMembers] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [createForm, setCreateForm] = useState({ name: '' })
  const [inviteForm, setInviteForm] = useState({ username: '', role: 'member' })

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroupId) {
      loadMembers(selectedGroupId)
    } else {
      setMembers([])
    }
  }, [selectedGroupId])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const response = await groupsService.getAll()
      setGroups(response.data.groups || [])
      setMemberships(response.data.memberships || [])
      if ((response.data.groups || []).length > 0) {
        setSelectedGroupId(response.data.groups[0]._id)
      }
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar grupos')
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (groupId: string) => {
    try {
      const response = await groupsService.getMembers(groupId)
      setMembers(response.data.members || [])
    } catch (err: any) {
      console.error('Erro ao carregar membros', err)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await groupsService.create({ name: createForm.name })
      setCreateForm({ name: '' })
      await loadGroups()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar grupo')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroupId) return
    try {
      await groupsService.addMember(selectedGroupId, inviteForm)
      setInviteForm({ username: '', role: 'member' })
      await loadMembers(selectedGroupId)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao adicionar membro')
    }
  }

  const getMembershipRole = (groupId: string) => {
    return memberships.find(m => m.groupId === groupId)?.role || 'member'
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          color: 'var(--primary-dark)',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          Grupos
        </h1>
        <p style={{ color: 'var(--gray-600)', margin: 0 }}>
          Crie grupos e compartilhe seus gastos.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#b91c1c',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Criar novo grupo</h3>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ name: e.target.value })}
              placeholder="Nome do grupo"
              className="form-input"
              required
            />
            <button type="submit" className="btn btn-primary">Criar</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Selecionar grupo</h3>
          <select
            className="form-select"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={loading || groups.length === 0}
          >
            {groups.length === 0 && <option value="">Nenhum grupo</option>}
            {groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.name} ({getMembershipRole(group._id)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Grupos</h3>
        {groups.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>Nenhum grupo criado ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {groups.map(group => (
              <li key={group._id} style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                backgroundColor: selectedGroupId === group._id ? 'var(--gray-50)' : 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{group.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Papel: {getMembershipRole(group._id)}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedGroupId(group._id)}
                >
                  Ver membros
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedGroupId && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Membros</h3>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="username"
                value={inviteForm.username}
                onChange={(e) => setInviteForm(prev => ({ ...prev, username: e.target.value }))}
                className="form-input"
                required
              />
              <select
                className="form-select"
                value={inviteForm.role}
                onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="member">Membro</option>
                <option value="owner">Owner</option>
              </select>
              <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>
          </div>

          {members.length === 0 ? (
            <p style={{ color: 'var(--gray-500)' }}>Nenhum membro encontrado.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.map(member => (
                <li key={member._id} style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: 600 }}>{member.userId}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Papel: {member.role}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

