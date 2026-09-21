import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import StatusPill from './StatusPill';
import Pagination from './Pagination';
import Button from './Button';
import SearchField from './SearchField';
import SelectField from './SelectField';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

interface CodedEntity {
  id: string;
  name: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  [key: string]: any;
}

interface CodedMasterListPageProps {
  title: string;
  codeField: string;
  codeLabel: string;
  addButtonLabel: string;
  newPath: string;
  editPathPrefix: string;
  api: {
    list: (params: any) => Promise<{ data: CodedEntity[]; pagination: any }>;
    updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => Promise<CodedEntity>;
  };
}

const CodedMasterListPage = ({
  title,
  codeField,
  codeLabel,
  addButtonLabel,
  newPath,
  editPathPrefix,
  api,
}: CodedMasterListPageProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CodedEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.list({
        page,
        limit: 10,
        search: searchRef.current || undefined,
        status: statusFilter || undefined,
      });
      setItems(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, statusFilter]);

  const handleToggleStatus = async (item: CodedEntity) => {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(item.id);
    try {
      await api.updateStatus(item.id, nextStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <Button onClick={() => navigate(newPath)}>{addButtonLabel}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchField
            placeholder={`Search by name or ${codeLabel.toLowerCase()}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <div className="sm:w-48">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | '')}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message="No records found." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">{codeLabel}</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Phone</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{item[codeField]}</td>
                  <td className="px-4 py-3 text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {item.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`${editPathPrefix}/${item.id}/edit`)}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      disabled={togglingId === item.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default CodedMasterListPage;
