import { Button } from "../../ui/button";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
      <div className="text-sm text-slate-700">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
