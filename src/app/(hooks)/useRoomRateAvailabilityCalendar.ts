// Import necessary modules and types
import { Dayjs } from "dayjs";
import Fetch, { IResult } from "@/utils/Fetch";
import { useInfiniteQuery } from "@tanstack/react-query";

// Define interfaces for the data structures used in the calendar
export interface IRoomInventory {
  id: string;
  date: Dayjs;
  available: number;
  status: boolean;
  booked: number;
}

export interface IRoomRatePlans {
  id: number;
  name: string;
}

export interface IRateCalendar {
  id: string;
  date: Dayjs;
  rate: number;
  min_length_of_stay: number;
  reservation_deadline: number;
}

export interface IRatePlanCalendar extends IRoomRatePlans {
  calendar: Array<IRateCalendar>;
}

export interface IRoomCategory {
  id: string;
  name: string;
  occupancy: number;
}

export interface IRoomCategoryCalender extends IRoomCategory {
  inventory_calendar: Array<IRoomInventory>;
  rate_plans: Array<IRatePlanCalendar>;
}

// Define the parameters and response interfaces for the hook
interface IParams {
  property_id: number;
  start_date: string;
  end_date: string;
}

interface IResponse {
  room_categories: Array<IRoomCategoryCalender>;
  nextCursor?: number;
}

// Custom hook to fetch room rate availability calendar data
export default function useRoomRateAvailabilityCalendar(params: IParams) {
  // Construct the URL with query parameters
  const url = new URL(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/property/${params.property_id}/rate-calendar/assessment`
  );

  // Use React Query's useQuery hook to fetch data
  return useInfiniteQuery({
    queryKey: ["property_room_calendar", params],
    queryFn: async ({ pageParam = 0 }) => {
      url.search = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        cursor: String(pageParam),
      }).toString();

      return await Fetch<IResponse>({
        method: "GET",
        url,
      });
    },
    getNextPageParam: (lastPage: IResult<IResponse>) =>
      lastPage.data.nextCursor || undefined,
    initialPageParam: 0,
  });
}
