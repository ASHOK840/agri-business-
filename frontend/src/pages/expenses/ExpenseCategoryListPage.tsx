import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listExpenseCategories,
  updateExpenseCategoryStatus,
} from '../../services/expenseCategoryService';
import type { ExpenseCategory } from '../../types/expenseCategory.types';
import StatusPill from '../../components/common/StatusPill';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';

const ExpenseCategoryListPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCategories = () => {
    setIsLoading(true);
    listExpenseCategories({ limit: 100 })
      .then((res) => setCategories(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchCategories, []);

  const handleToggleStatus = async (category: ExpenseCategory) => {
    const nextStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(category.id);
    try {
      await updateExpenseCategoryStatus(category.id, nextStatus);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, status: nextStatus } : c))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <PageHeader
        title="Expense Categories"
        action={<Button variant="secondary" onClick={() => navigate('/expense-categories/new')}>+ Add Category</Button>}
      />

      <p className="text-sm text-gray-500 mb-6">
        These are the categories available when recording a business expense. Add, rename, or
        deactivate them here — no code change needed. Transportation and Labour costs already
        tracked via Transport Records and Staff Assignments are automatically included in the
        expense summary — only add an expense in those categories here for costs not already
        covered there, to avoid counting the same cost twice.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No expense categories configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{category.code}</td>
                  <td className="px-4 py-3 text-gray-800">{category.name}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={category.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/expense-categories/${category.id}/edit`)}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(category)}
                      disabled={togglingId === category.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {category.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategoryListPage;
