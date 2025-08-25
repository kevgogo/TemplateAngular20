// Query de ejemplo (ajústalo a tu esquema)
export const FARMS_QUERY = `
  query QueryFarm($co: Boolean) {
    farms(where: { isCo: $co }) {
      farm_id
      farm_id_colibri
      farm_name
      farm_short_name
    }
  }
`;
