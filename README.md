# Project Documentation

## Overview

This project is part of the Grit System Technical Assessment for Front-End Engineers. The main objective is to enhance the calendar component by implementing infinite scrolling using a cursor query parameter in the `useRoomRateAvailabilityCalendar` query. Additionally, the candidate will optimize the horizontal scroll behavior of the calendar to ensure smooth and responsive navigation.

## Changes Made

### 1. Infinite Scrolling Implementation

The way the calendar gets data has been changed to support long lists of information. We now use a technique called "infinite scrolling."

- **Getting Data in Parts:** Instead of getting all the data at once, the calendar now gets it in smaller pieces. It uses a special marker called a "cursor" to know where it left off and where to get the next piece. The server sends back a "next cursor" so the calendar knows where to look for even more data.
- **Automatic Loading:** When user scroll close to the bottom of the calendar, it automatically asks for the next piece of data. This is done using the "next cursor" from the server.
- **Showing "Loading" Message:** While the calendar is fetching more data, it displays a 'Loading' indicator to provide user feedback.

### 2. Optimized Horizontal Scrolling

Horizontal scrolling in the calendar has been improved, making it much smoother and more responsive.

- **Consolidated References (Refs):** Multiple individual refs have been consolidated into a single `scrollRefs` object using `useRef`. This simplifies ref management and improves code organization.
- **Unified Scroll Handling:** Separate scroll handlers have been merged into a single `handleScroll` function, ensuring consistent scrolling behavior across all horizontally scrollable elements (months, dates, and inventory grids).
- **Efficient Event Handling:** The logic for handling `wheel` and `scroll` events has been consolidated into a single `useEffect` hook. This reduces unnecessary re-renders and improves performance.
- **Memoization:** `React.memo` and `useCallback` are used to prevent unnecessary re-renders of components and functions, further optimizing performance.
- **Smooth Scrolling Implementation:** `requestAnimationFrame` is used to synchronize scroll updates, eliminating jank and creating a fluid scrolling experience.
- **Code Refactoring:** The code has been thoroughly refactored for improved readability, maintainability, and reduced code duplication. This includes better variable naming, logical code organization, and removal of redundant logic.

### Live Demo

This live demo showcases the recent improvements:  
[**Rate Availability Calendar**](https://rate-availability-calendar-gilt.vercel.app/)

## Rate Calendar API Documentation

### Base URL

`https://beta.api.bytebeds.com`

### Endpoint

`GET /api/v1/property/{property_id}/rate-calendar/assessment`

### Query Parameters

- `property_id` (number): The ID of the property.
- `start_date` (string): The start date for the calendar data in YYYY-MM-DD format.
- `end_date` (string): The end date for the calendar data in YYYY-MM-DD format.
- `cursor` (number, optional): The cursor for pagination, used for infinite scrolling.

### Response

The response contains the following structure:

```json
{
  "room_categories": [
    {
      "id": "string",
      "name": "string",
      "occupancy": "number",
      "inventory_calendar": [
        {
          "id": "string",
          "date": "string",
          "available": "number",
          "status": "boolean",
          "booked": "number"
        }
      ],
      "rate_plans": [
        {
          "id": "number",
          "name": "string",
          "calendar": [
            {
              "id": "string",
              "date": "string",
              "rate": "number",
              "min_length_of_stay": "number",
              "reservation_deadline": "number"
            }
          ]
        }
      ]
    }
  ],
  "nextCursor": "number"
}
```

### Postman Collection

You can find a working Postman collection for this API [here](https://www.postman.com/blue-star-32935/workspace/grit-system/request/26020074-3b661363-f648-4233-9020-4a1264b0d9e7?action=share&creator=26020074&ctx=documentation).

## Instructions for Future Developers

### Maintaining Infinite Scrolling

1. **API Compatibility**:

   - Double-check that the API you're using supports loading data in chunks. It should allow a "cursor" parameter for pagination and return a "nextCursor" value to indicate more data is available.
   - If the API changes the way it delivers data, update the `getNextPageParam` function to handle the new structure.

2. **Error Handling**:

   - Make sure the code gracefully handles errors when fetching data from the API. This ensures the application remains stable even if something goes wrong.
   - If there's no more data to load (e.g., the user has reached the end of the results), show a message or disable the "Load More" button.

3. **Performance Optimization:**
   - For general list performance, use `useMemo` and `useCallback`.
   - When using `react-window`:
     - Use `FixedSizeList`/`Grid` for fixed sizes and `VariableSizeList`/`Grid` with a correct `itemSize` function for dynamic sizes.
     - Minimize re-renders with `areEqual` or `React.memo` (with a custom comparison) for complex list items.

### Extending Infinite Scrolling

1. **Adding a "Load More" Button**:

   - You can add a "Load More" button that triggers the `fetchNextPage` function provided by `useInfiniteQuery`. This function manually loads the next page of data.
   - When there's no more data to load, disable the button or display a message to the user.

2. **Custom Pagination Logic**:
   - If the API uses a different approach for pagination (e.g., `offset` and `limit` parameters instead of a cursor), modify the `getNextPageParam` function to handle that specific logic.
