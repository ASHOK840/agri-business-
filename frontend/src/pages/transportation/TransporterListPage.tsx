import CodedMasterListPage from '../../components/common/CodedMasterListPage';
import { transporterApi } from '../../services/transportMasterService';

const TransporterListPage = () => (
  <CodedMasterListPage
    title="Transporters"
    codeField="transporterCode"
    codeLabel="Transporter Code"
    addButtonLabel="+ Add Transporter"
    newPath="/transporters/new"
    editPathPrefix="/transporters"
    api={transporterApi}
  />
);

export default TransporterListPage;
