import buildSeasonList from "utils/buildSeasonList";
import { dbApiFetcher } from "lib/api-fetcher";
import {
  getSplitViewFromSlugWithApiConfig,
  translateLeaderViewToSlug,
} from "utils/slugHelpers";
import { useApiConfigContext } from "context/ApiConfig";
import * as React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

import ApiConfig from "types/apiConfig";
import { GetStaticPaths, GetStaticProps } from "next";
import PlayerStats from "types/playerStats";

import ApiUsageHelper from "components/ApiUsageHelper";
import { Box, Flex, Skeleton, Stack } from "@chakra-ui/react";
import ErrorPage from "next/error";
import Head from "next/head";
import Layout from "components/Layout";
import PitchingStatTable from "components/PitchingStatTable";
import StatsNavigation from "components/StatsNavigation";
import SplitViewSelect from "components/SplitViewSelect";

type PitchingStatsProps = {
  playerStats: PlayerStats[];
};

export default function PitchingStats(props: PitchingStatsProps) {
  const apiConfig: ApiConfig = useApiConfigContext();
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const leaderView = getSplitViewFromSlugWithApiConfig({
    apiConfig,
    viewSlug: router.query.hittingViewSlug,
  });
  const [selectedView, setSelectedView] = React.useState(leaderView);

  const {
    data: playerStats,
    error: playerStatsError,
    isValidating: playerStatsIsValidating,
  } = useSWR(
    () =>
      selectedView != null
        ? `/stats?group=pitching&type=seasonCombined&season=${selectedView}`
        : null,
    dbApiFetcher,
    {
      initialData: props.playerStats,
    }
  );

  React.useEffect(() => {
    if (apiConfig !== undefined) {
      setSelectedView(leaderView);
    }
  }, [apiConfig]);

  React.useEffect(() => {
    if (router.query.pitchingViewSlug != null) {
      setIsLoading(false);
    }
  }, [router.query.pitchingViewSlug]);

  const handleSelectChange = (
    evt: React.FormEvent<HTMLSelectElement>
  ): void => {
    evt.preventDefault();
    setSelectedView(evt.currentTarget.value);
    setIsLoading(true);

    router.push(
      `/stats/pitching/${translateLeaderViewToSlug(evt.currentTarget.value)}`
    );
  };

  if (!router.isFallback && playerStats == null && !playerStatsIsValidating) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <Head>
        <title>Player Pitching Stats - Blaseball-Reference.com</title>
        <meta
          property="og:title"
          content={`Player Pitching Stats - Blaseball-Reference.com`}
          key="og:title"
        />
        <meta
          name="description"
          property="og:description"
          content={`Pitching stats for every player in Blaseball.`}
        />
      </Head>
      <Layout>
        {playerStatsError ? (
          <Box>
            Sorry, we're currently having a siesta and are unable to provide you
            the requested data.
          </Box>
        ) : (
          <>
            <StatsNavigation group="player" statType="pitching" />

            <SplitViewSelect
              handleSelectChange={handleSelectChange}
              selectedView={selectedView}
            />

            <StatsTable
              playerStats={playerStats}
              playerStatsIsValidating={playerStatsIsValidating}
              selectedView={selectedView}
            />

            <Flex justifyContent="center" mt={6}>
              <ApiUsageHelper
                apiCalls={[
                  `${process.env.NEXT_PUBLIC_DATABLASE_API}/config`,
                  `${process.env.NEXT_PUBLIC_DATABLASE_API}/stats?group=pitching&type=seasonCombined&season=${selectedView}`,
                ]}
              />
            </Flex>
          </>
        )}
      </Layout>
    </>
  );
}

type StatsTableProps = {
  playerStats: PlayerStats[];
  playerStatsIsValidating: boolean;
  selectedView: string | null;
};

function StatsTable({
  playerStats,
  playerStatsIsValidating,
  selectedView,
}: StatsTableProps) {
  if (!playerStats && !playerStatsIsValidating) {
    return null;
  }

  if (playerStatsIsValidating) {
    return (
      <Stack>
        <Skeleton height="20px" />
        <Skeleton height="20px" />
        <Skeleton height="20px" />
      </Stack>
    );
  }

  const pitchingStats: PlayerStats | null = playerStats
    ? playerStats.find((statGroup) => statGroup.group === "pitching")
    : null;

  return (
    <Box mb={4}>
      <PitchingStatTable
        pitchingStats={pitchingStats}
        isPaginated={true}
        statTargetName="All Players"
      />
    </Box>
  );
}

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  let apiConfig: ApiConfig | null = null;
  let playerStats: PlayerStats[] | null = null;

  try {
    apiConfig = await dbApiFetcher("/config");
  } catch (error) {
    console.log(error);
  }

  const splitView = getSplitViewFromSlugWithApiConfig({
    apiConfig,
    viewSlug:
      params.hittingViewSlug !== undefined
        ? String(params.hittingViewSlug)
        : undefined,
  });

  try {
    playerStats = await dbApiFetcher(
      `/stats?type=seasonCombined&season=${splitView}&group=pitching`
    );
  } catch (error) {
    console.log(error);
  }

  return {
    props: {
      preview,
      playerStats,
    },
    revalidate: 2700,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  let apiConfig: ApiConfig | null = null;

  try {
    apiConfig = await dbApiFetcher("/config");
  } catch (error) {
    console.log(error);
  }

  const minSeason =
    apiConfig != null ? apiConfig.seasons?.minSeason : undefined;
  const maxSeason =
    apiConfig != null ? apiConfig.seasons?.maxSeason : undefined;
  const seasonList = buildSeasonList({ minSeason, maxSeason });

  const viewList = seasonList
    ? seasonList.map((view) => translateLeaderViewToSlug(view))
    : [];

  return {
    paths:
      [
        "/stats/pitching",
        ...viewList.map((view) => `/stats/pitching/${view}`),
      ] || [],
    fallback: false,
  };
};
