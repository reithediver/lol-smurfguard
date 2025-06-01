# league-of-legends-api-wrapper

> The purest wrapper over the league of legends api

# Feature

| api           | ☑️  |
| ------------- | --- |
| CHAMPION-V3   | ✅  |
| CLASH-V1      | ✅  |
| LEAGUE-EXP-V4 | ✅  |
| LEAGUE-V4     | ✅  |
| LOL-STATUS-V4 | ✅  |
| MATCH-V5      | ✅  |
| SPECTATOR-V4  | ✅  |
| SUMMONER-V4   | ✅  |

# Using

```typescript
import LeagueOfLegendsAPI from 'league-of-legends-api-wrapper'

const lol = new LeagueOfLegendsAPI({
    token: 'riot games api token with access to league of legends api',
    region: 'kr',
})

riot.lol.status.get().then(console.log).catch(console.error)
```

# Documentation

### LeagueOfLegendsAPI[LeagueOfLegendsAPIOptions]

-   `token` is required, to get it, follow the [Riot Developer Portal](https://developer.riotgames.com)
-   `region` is required, available: 'br1', 'eun1', 'euw1', 'jp1', 'kr', 'la1', 'la2', 'na1', 'oc1', 'ph1', 'ru', 'sg2', 'th2', 'tr1', 'tw2', 'vn2'
