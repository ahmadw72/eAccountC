import { DASHBOARD_PAGE, SALES_PAGE } from '../utils';

export default function Navigation({ canViewSalesPage, currentPage, onNavigate }) {
  return (
    <div className="page-tabs">
      <button
        type="button"
        className={currentPage === DASHBOARD_PAGE ? 'secondary-button active-tab' : 'secondary-button'}
        onClick={() => onNavigate(DASHBOARD_PAGE)}
      >
        Dashboard
      </button>
      {canViewSalesPage ? (
        <button
          type="button"
          className={currentPage === SALES_PAGE ? 'secondary-button active-tab' : 'secondary-button'}
          onClick={() => onNavigate(SALES_PAGE)}
        >
          Sales Page
        </button>
      ) : null}
    </div>
  );
}