import TaskList from './tasklist';
import Protected from '../../../../components/Protected/Protected';

function ProjectDetails() {
  return (
    <TaskList />
  );
}

export default Protected(ProjectDetails, ["admin"]);
