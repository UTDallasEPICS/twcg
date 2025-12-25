export const useTablePreferences = () => {
  const itemsPerPage = useCookie<number>('table-items-per-page', {
    default: () => 5,
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  return {
    itemsPerPage,
  }
}
