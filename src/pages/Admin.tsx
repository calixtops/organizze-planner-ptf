import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { familyMembersService } from '../services/api'
import { FamilyMember } from '../types'
import api from '../services/api'

interface User {
  _id: string
  name: string
  username: string
  createdAt: string
}

export default function Admin() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'members'>('members')
  const [users, setUsers] = useState<User[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: ''
  })

  const [memberFormData, setMemberFormData] = useState({
    name: '',
    color: '#3498db'
  })

  const colors = [
    { value: '#3498db', label: 'Azul' },
    { value: '#e74c3c', label: 'Vermelho' },
    { value: '#2ecc71', label: 'Verde' },
    { value: '#f39c12', label: 'Laranja' },
    { value: '#9b59b6', label: 'Roxo' },
    { value: '#1abc9c', label: 'Turquesa' },
    { value: '#e91e63', label: 'Rosa' },
  ]

  useEffect(() => {
    loadUsers()
    loadMembers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const response = await familyMembersService.getAll()
      setMembers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
      setMembers([])
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userFormData.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      await api.post('/auth/register', userFormData)
      alert('Usuário criado com sucesso!')
      setShowUserForm(false)
      resetUserForm()
      loadUsers()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar usuário')
    }
  }

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingMember) {
        await familyMembersService.update(editingMember._id, memberFormData)
        alert('Membro atualizado com sucesso!')
      } else {
        await familyMembersService.create(memberFormData)
        alert('Membro criado com sucesso!')
      }
      
      setShowMemberForm(false)
      resetMemberForm()
      loadMembers()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar membro')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?._id) {
      alert('Você não pode excluir seu próprio usuário!')
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      await api.delete(`/users/${userId}`)
      alert('Usuário excluído com sucesso!')
      loadUsers()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir usuário')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este membro?')) return

    try {
      await familyMembersService.delete(memberId)
      alert('Membro excluído com sucesso!')
      loadMembers()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir membro')
    }
  }

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member)
    setMemberFormData({
      name: member.name,
      color: member.color || '#3498db'
    })
    setShowMemberForm(true)
  }

  const resetUserForm = () => {
    setUserFormData({ name: '', username: '', password: '' })
  }

  const resetMemberForm = () => {
    setMemberFormData({ name: '', color: '#3498db' })
    setEditingMember(null)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>⚙️ Painel Administrativo</h2>

      {/* Info do usuário logado */}
      <div style={{
        backgroundColor: '#3498db',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>👤 Usuário Logado</h3>
        <p style={{ margin: '5px 0' }}><strong>Nome:</strong> {user?.name}</p>
        <p style={{ margin: '5px 0' }}><strong>Username:</strong> {user?.username}</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'members' ? '#2ecc71' : '#ecf0f1',
            color: activeTab === 'members' ? 'white' : '#7f8c8d',
            border: 'none',
            borderRadius: '6px 0 0 6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👨‍👩‍👧‍👦 Membros da Família
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'users' ? '#2ecc71' : '#ecf0f1',
            color: activeTab === 'users' ? 'white' : '#7f8c8d',
            border: 'none',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👥 Usuários do Sistema
        </button>
      </div>

      {/* Conteúdo Membros da Família */}
      {activeTab === 'members' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666' }}>
              Gerencie os membros da sua família para controlar quem pagou cada gasto
            </p>
            <button
              onClick={() => { resetMemberForm(); setShowMemberForm(true) }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              + Novo Membro
            </button>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>
            ) : members.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                Nenhum membro cadastrado
              </div>
            ) : (
              <div>
                {members.map(member => (
                  <div
                    key={member._id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: member.color || '#3498db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>{member.name}</h4>
                        <small style={{ color: '#666' }}>
                          Criado em {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                        </small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleEditMember(member)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Conteúdo Usuários do Sistema */}
      {activeTab === 'users' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666' }}>
              Usuários que podem acessar o sistema
            </p>
            <button
              onClick={() => setShowUserForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              + Novo Usuário
            </button>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                Nenhum usuário encontrado
              </div>
            ) : (
              <div>
                {users.map(u => (
                  <div
                    key={u._id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: u._id === user?._id ? '#f8f9fa' : 'white'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>
                        {u.name}
                        {u._id === user?._id && (
                          <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            fontSize: '12px',
                            borderRadius: '4px'
                          }}>
                            Você
                          </span>
                        )}
                      </h4>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <span>Username: <strong>{u.username}</strong></span>
                        <span style={{ margin: '0 10px', color: '#ddd' }}>|</span>
                        <span>Criado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    {u._id !== user?._id && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Membro */}
      {showMemberForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingMember ? 'Editar Membro' : 'Novo Membro'}</h3>
              <button
                onClick={() => { setShowMemberForm(false); resetMemberForm() }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleMemberSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: João, Maria, etc."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Cor *
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {colors.map(c => (
                    <div
                      key={c.value}
                      onClick={() => setMemberFormData({ ...memberFormData, color: c.value })}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '8px',
                        backgroundColor: c.value,
                        cursor: 'pointer',
                        border: memberFormData.color === c.value ? '3px solid #000' : '2px solid #ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      title={c.label}
                    >
                      {memberFormData.color === c.value && '✓'}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowMemberForm(false); resetMemberForm() }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Usuário */}
      {showUserForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Novo Usuário</h3>
              <button
                onClick={() => { setShowUserForm(false); resetUserForm() }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUserSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: joaosilva"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Senha *
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Mínimo 6 caracteres"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Mínimo de 6 caracteres
                </small>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowUserForm(false); resetUserForm() }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
