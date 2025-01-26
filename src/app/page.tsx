"use client";

// Import necessary modules and components
import {
  Grid2 as Grid,
  Typography,
  Card,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateRange } from "@mui/x-date-pickers-pro";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";
import { Controller, useForm } from "react-hook-form";
import {
  RefObject,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  VariableSizeList,
  ListChildComponentProps,
  areEqual,
  FixedSizeGrid,
  GridChildComponentProps,
  VariableSizeGrid,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { countDaysByMonth } from "@/utils";
import RoomRateAvailabilityCalendar from "./(components)/RoomCalendar";
import Navbar from "@/components/Navbar";
import useRoomRateAvailabilityCalendar from "./(hooks)/useRoomRateAvailabilityCalendar";

// Define the form type for the date range picker
export type CalendarForm = {
  date_range: DateRange<dayjs.Dayjs>;
};

// Style the VariableSizeList to hide the scrollbar
const StyledVariableSizeList = styled(VariableSizeList)({
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
});

export default function Page() {
  const theme = useTheme();
  const propertyId = 1;

  const scrollRefs = useRef({
    rootContainer: null as HTMLDivElement | null,
    calenderMonths: null as VariableSizeList | null,
    calenderDates: null as FixedSizeGrid | null,
    mainGridContainer: null as HTMLDivElement | null,
    inventory: [] as Array<RefObject<VariableSizeGrid>>,
  });

  // Optimize scroll handler
  const handleScroll = useCallback(({ scrollLeft }: { scrollLeft: number }) => {
    const { calenderMonths, calenderDates, inventory } = scrollRefs.current;

    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      inventory.forEach((ref) => {
        if (ref.current) {
          ref.current.scrollTo({ scrollLeft });
        }
      });

      if (calenderMonths) {
        calenderMonths.scrollTo(scrollLeft);
      }

      if (calenderDates) {
        calenderDates.scrollTo({ scrollLeft });
      }
    });
  }, []);

  // Optimized wheel event handler
  useEffect(() => {
    const rootContainer = scrollRefs.current.rootContainer;
    if (!rootContainer) return;

    let ticking = false;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaX === 0) return;

      e.preventDefault();
      if (!ticking) {
        requestAnimationFrame(() => {
          const mainGridContainer = scrollRefs.current.mainGridContainer;
          if (mainGridContainer) {
            const newScrollLeft = mainGridContainer.scrollLeft + e.deltaX;
            handleScroll({ scrollLeft: newScrollLeft });
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    rootContainer.addEventListener("wheel", handleWheel, { passive: false });
    return () => rootContainer.removeEventListener("wheel", handleWheel);
  }, [handleScroll]);

  // State for calendar dates and months
  const [calenderDates, setCalenderDates] = useState<Array<dayjs.Dayjs>>([]);
  const [calenderMonths, setCalenderMonths] = useState<Array<[string, number]>>(
    []
  );

  // Form control for date range picker
  const { control, watch } = useForm<CalendarForm>({
    defaultValues: {
      date_range: [dayjs(), dayjs().add(4, "month")],
    },
  });
  const watchedDateRange = watch("date_range");

  // Update calendar dates and months when the date range changes
  useEffect(() => {
    const { months, dates } = countDaysByMonth(
      watchedDateRange[0]!,
      watchedDateRange[1]
        ? watchedDateRange[1]
        : watchedDateRange[0]!.add(2, "month")
    );

    setCalenderMonths(months);
    setCalenderDates(dates);
  }, [watchedDateRange]);

  // Fetch room rate availability calendar data
  const room_calendar = useRoomRateAvailabilityCalendar({
    property_id: propertyId,
    start_date: watchedDateRange[0]!.format("YYYY-MM-DD"),
    end_date: (watchedDateRange[1]
      ? watchedDateRange[1]
      : watchedDateRange[0]!.add(2, "month")
    ).format("YYYY-MM-DD"),
  });

  // Handle infinite scroll for vertical data loading
  const handleInfiniteScroll = useCallback(() => {
    if (
      scrollRefs.current.rootContainer &&
      scrollRefs.current.rootContainer.scrollHeight -
        scrollRefs.current.rootContainer.scrollTop <=
        scrollRefs.current.rootContainer.clientHeight + 100
    ) {
      if (room_calendar.hasNextPage && !room_calendar.isFetchingNextPage) {
        room_calendar.fetchNextPage();
      }
    }
  }, [room_calendar]);

  useEffect(() => {
    const container = scrollRefs.current.rootContainer;
    if (container) {
      container.addEventListener("scroll", handleInfiniteScroll);
      return () =>
        container.removeEventListener("scroll", handleInfiniteScroll);
    }
  }, [handleInfiniteScroll]);

  // Component to render each month row in the calendar
  const MonthRow: React.FC<ListChildComponentProps> = memo(function MonthRowFC({
    index,
    style,
  }) {
    const month = calenderMonths[index][0];

    return (
      <Box style={style}>
        <Box
          sx={{
            px: 1,
            fontSize: "12px",
            fontWeight: "bold",
            borderLeft: "1px solid",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Box
            component="span"
            sx={{
              position: "sticky",
              left: 2,
              zIndex: 1,
            }}
          >
            {month}
          </Box>
        </Box>
      </Box>
    );
  },
  areEqual);

  // Component to render each date row in the calendar
  const DateRow: React.FC<GridChildComponentProps> = memo(function DateRowFC({
    columnIndex,
    style,
  }) {
    return (
      <Box style={style}>
        <Box
          sx={{
            pr: 1,
            fontSize: "12px",
            textAlign: "right",
            fontWeight: "bold",
            borderLeft: "1px solid",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Box>{calenderDates[columnIndex].format("ddd")}</Box>
          <Box>{calenderDates[columnIndex].format("DD")}</Box>
        </Box>
      </Box>
    );
  },
  areEqual);

  return (
    <Container sx={{ backgroundColor: "#EEF2F6" }}>
      <Navbar />
      <Box>
        <Card elevation={1} sx={{ padding: 4, mt: 4 }}>
          <Grid container columnSpacing={2}>
            <Grid size={12}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 0,
                }}
              >
                Rate Calendar
              </Typography>
            </Grid>

            <Grid size={4}>
              <Controller
                name="date_range"
                control={control}
                rules={{
                  required: "Please specify a date range.",
                }}
                render={({ field, fieldState: { invalid, error } }) => (
                  <DateRangePicker
                    {...field}
                    autoFocus
                    minDate={dayjs()}
                    maxDate={dayjs().add(2, "year")}
                    slots={{ field: SingleInputDateRangeField }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: invalid,
                        helperText: invalid ? error?.message : null,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card>
        <Card
          elevation={1}
          ref={(el) => {
            scrollRefs.current.rootContainer = el;
          }}
          sx={{
            my: 6,
            padding: 3,
            overflow: "auto",
            height: "calc(100vh - 414px)",
          }}
        >
          <Grid container columnSpacing={2}>
            <Grid
              size={{
                xs: 4,
                sm: 4,
                md: 3,
                lg: 2,
                xl: 2,
              }}
            ></Grid>

            <Grid
              size={{
                xs: 8,
                sm: 8,
                md: 9,
                lg: 10,
                xl: 10,
              }}
            >
              <AutoSizer disableHeight>
                {({ width }) => (
                  <StyledVariableSizeList
                    height={19}
                    width={width}
                    itemCount={calenderMonths.length}
                    itemSize={(index: number) => {
                      const no_of_days = calenderMonths[index][1];
                      return no_of_days * 74;
                    }}
                    layout="horizontal"
                    ref={(el) => {
                      scrollRefs.current.calenderMonths = el;
                    }}
                  >
                    {MonthRow}
                  </StyledVariableSizeList>
                )}
              </AutoSizer>
            </Grid>
          </Grid>

          <Grid container sx={{ height: 48 }}>
            <Grid
              sx={{
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
              }}
              size={{
                xs: 4,
                sm: 4,
                md: 3,
                lg: 2,
                xl: 2,
              }}
            ></Grid>
            <Grid
              size={{
                xs: 8,
                sm: 8,
                md: 9,
                lg: 10,
                xl: 10,
              }}
            >
              <AutoSizer>
                {({ height, width }) => (
                  <FixedSizeGrid
                    height={height}
                    width={width}
                    columnCount={calenderDates.length}
                    columnWidth={74}
                    rowCount={1}
                    rowHeight={37}
                    ref={(el) => {
                      scrollRefs.current.calenderDates = el;
                    }}
                    outerRef={(el) =>
                      (scrollRefs.current.mainGridContainer = el)
                    }
                    onScroll={handleScroll}
                  >
                    {DateRow}
                  </FixedSizeGrid>
                )}
              </AutoSizer>
            </Grid>
          </Grid>

          {room_calendar.isSuccess
            ? room_calendar.data.pages.map((page, index) => (
                <Box key={index}>
                  {page.data.room_categories.map((room_category, key) => (
                    <RoomRateAvailabilityCalendar
                      key={key}
                      index={key}
                      InventoryRefs={scrollRefs.current.inventory}
                      isLastElement={
                        key === page.data.room_categories.length - 1
                      }
                      room_category={room_category}
                      handleCalenderScroll={handleScroll}
                    />
                  ))}
                </Box>
              ))
            : null}

          {/* Infinite Scroll Trigger */}
          {room_calendar.hasNextPage && (
            <Box
              sx={{
                py: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography color="gray">Loading more...</Typography>
            </Box>
          )}
        </Card>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          textAlign: "center",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Grit System. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}
