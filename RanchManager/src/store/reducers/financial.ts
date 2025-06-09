import { FinancialState } from '../types/financial';

const initialState: FinancialState = {
  transactions: {
    items: [],
    selected: null,
    filters: {},
    loading: false,
    error: null
  },
  budgets: {
    items: [],
    selected: null,
    loading: false,
    error: null,
    filter: {
      type: 'all',
      searchQuery: ''
    }
  },
  reports: {
    items: [],
    selected: null,
    loading: false,
    error: null
  },
  summary: {
    current: null,
    loading: false,
    error: null
  }
};

export const financialReducer = (state = initialState, action: any): FinancialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section],
          loading: action.payload.value
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section],
          error: action.payload.value
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section],
          error: null
        }
      };

    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          items: action.payload
        }
      };

    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          items: [...state.transactions.items, action.payload]
        }
      };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          items: state.transactions.items.map(transaction =>
            transaction.id === action.payload.id ? action.payload : transaction
          )
        }
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          items: state.transactions.items.filter(
            transaction => transaction.id !== action.payload
          )
        }
      };

    case 'SET_BUDGETS':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          items: action.payload
        }
      };

    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          items: [...state.budgets.items, action.payload]
        }
      };

    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          items: state.budgets.items.map(budget =>
            budget.id === action.payload.id ? action.payload : budget
          )
        }
      };

    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          items: state.budgets.items.filter(budget => budget.id !== action.payload)
        }
      };

    case 'SET_REPORT':
      return {
        ...state,
        reports: {
          ...state.reports,
          items: [...state.reports.items, action.payload]
        }
      };

    case 'CLEAR_REPORT':
      return {
        ...state,
        reports: {
          ...state.reports,
          items: state.reports.items.filter(report => report.id !== action.payload)
        }
      };

    default:
      return state;
  }
}; 