import CodedMasterListPage from '../../components/common/CodedMasterListPage';
import { driverApi } from '../../services/transportMasterService';

const DriverListPage = () => (
  <CodedMasterListPage
    title="Drivers"
    codeField="driverCode"
    codeLabel="Driver Code"
    addButtonLabel="+ Add Driver"
    newPath="/drivers/new"
    editPathPrefix="/drivers"
    api={driverApi}
  />
);

export default DriverListPage;
