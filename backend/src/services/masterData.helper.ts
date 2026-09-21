import { ListMasterQuery } from '../validators/transportMaster.validator';

export class DuplicateCodeError extends Error {
  constructor(entityName: string) {
    super(`A ${entityName} with this code already exists.`);
    this.name = 'DuplicateCodeError';
  }
}

export class NotFoundError extends Error {
  constructor(entityName: string) {
    super(`${entityName} not found.`);
    this.name = 'NotFoundError';
  }
}

interface CodedDelegate {
  findFirst: (args: any) => Promise<any>;
  findUnique: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any>;
  count: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
}

// Builds list/get/create/update/updateStatus functions for a master-data
// entity shaped like { id, [codeField], name, phone?, status }, with an
// auto-generated code (PREFIX-0001 style) when the caller omits one.
// Used by Transporter and Driver, which are structurally identical.
export const createCodedMasterService = (
  delegate: CodedDelegate,
  entityName: string,
  codeField: string,
  codePrefix: string
) => {
  const generateNextCode = async (): Promise<string> => {
    const last = await delegate.findFirst({
      where: { [codeField]: { startsWith: `${codePrefix}-` } },
      orderBy: { [codeField]: 'desc' },
    });

    let nextNumber = 1;
    if (last) {
      const match = (last[codeField] as string).match(/-(\d+)$/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    return `${codePrefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  const list = async (query: ListMasterQuery) => {
    const { page, limit, search, status } = query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { [codeField]: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      delegate.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  };

  const getById = async (id: string) => {
    const record = await delegate.findUnique({ where: { id } });
    if (!record) throw new NotFoundError(entityName);
    return record;
  };

  const create = async (input: { [key: string]: any }) => {
    const code = input[codeField] || (await generateNextCode());
    const existing = await delegate.findUnique({ where: { [codeField]: code } });
    if (existing) throw new DuplicateCodeError(entityName);

    return delegate.create({
      data: { [codeField]: code, name: input.name, phone: input.phone || null },
    });
  };

  const update = async (id: string, input: { [key: string]: any }) => {
    const existing = await getById(id);
    const nextCode = input[codeField] || existing[codeField];

    if (input[codeField]) {
      const byCode = await delegate.findUnique({ where: { [codeField]: input[codeField] } });
      if (byCode && byCode.id !== id) throw new DuplicateCodeError(entityName);
    }

    return delegate.update({
      where: { id },
      data: { [codeField]: nextCode, name: input.name, phone: input.phone || null },
    });
  };

  const updateStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    await getById(id);
    return delegate.update({ where: { id }, data: { status } });
  };

  return { list, getById, create, update, updateStatus };
};
