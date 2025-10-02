import { Account, CreditCard } from '../../types'
import { formatCurrency } from '../../utils/format'

interface TransactionFiltersProps {
  filters: {
    type: string
    category: string
    status: string
    accountId: string
    creditCardId: string
    startDate: string
    endDate: string
  }
  accounts: Account[]
  creditCards: CreditCard[]
  onFiltersChange: (filters: any) => void
}

export default function TransactionFilters({
  filters,
  accounts,
  creditCards,
  onFiltersChange
}: TransactionFiltersProps) {
  const handleFilterChange = (name: string, value: string) => {
    onFiltersChange({ [name]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: '',
      category: '',
      status: '',
      accountId: '',
      creditCardId: '',
      startDate: '',
      endDate: ''
    })
  }

  const categories = {
    income: ['Salário', 'Freelance', 'Investimentos', 'Vendas', 'Bônus', 'Outros'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Serviços', 'Assinaturas', 'Outros']
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          color: 'var(--primary-dark)',
          fontSize: '1rem',
          fontWeight: '600',
          margin: 0
        }}>
          Filtros
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Todas</option>
            {filters.type === 'income' || !filters.type ? (
              <>
                <optgroup label="Receitas">
                  {categories.income.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </optgroup>
              </>
            ) : null}
            {filters.type === 'expense' || !filters.type ? (
              <>
                <optgroup label="Despesas">
                  {categories.expense.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </optgroup>
              </>
            ) : null}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Conta</label>
          <select
            className="form-select"
            value={filters.accountId}
            onChange={(e) => handleFilterChange('accountId', e.target.value)}
          >
            <option value="">Todas</option>
            {accounts?.map(account => (
              <option key={account._id} value={account._id}>
                {account.name} - {formatCurrency(account.balance)}
              </option>
            )) || []}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Cartão</label>
          <select
            className="form-select"
            value={filters.creditCardId}
            onChange={(e) => handleFilterChange('creditCardId', e.target.value)}
          >
            <option value="">Todos</option>
            {creditCards?.map(card => (
              <option key={card._id} value={card._id}>
                {card.name} - {formatCurrency(card.limit - card.currentBalance)} disponível
              </option>
            )) || []}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Data inicial</label>
          <input
            type="date"
            className="form-input"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Data final</label>
          <input
            type="date"
            className="form-input"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
