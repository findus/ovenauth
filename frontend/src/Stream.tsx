import { useParams } from "solid-app-router";
import {Component, createEffect, createResource, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import { useService } from "solid-services";
import Player from "./Player";
import {ChatService } from "./store/ChatService";
import {AuthService} from "./store/AuthService";
import {StatService} from "./store/StatService";
import {viewCounter} from "./directives/viewCounter";

viewCounter

const Stream: Component = () => {
    const params = useParams();
    const chatService = useService(ChatService)
    const statService = useService(StatService);
    const authService = useService(AuthService);

    let aside;
    let input;

    const endpoint = import.meta.env.VITE_BASEURL;

    const css = {
        'aspect-ratio': '16 / 9',
        'max-width': '100%',
        'max-height': '100vh',
        'justify-conent' : 'stretch',
        margin: '0 auto'
    };


    const loginFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>Please log in</div>
    const whitelistFallback = <div style={{'text-align': 'center', 'font-size': '5vh'}}>No permission granted to watch this stream :(</div>
    const offline = <div style={{'text-align': 'center', 'font-size': '5vh'}}>
            Offline
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                 width="300.000000pt" height="80%" viewBox="0 0 300.000000 225.000000"
                 preserveAspectRatio="xMidYMid meet">
                <g class="text-base-content" transform="translate(0.000000,225.000000) scale(0.100000,-0.100000)"
                   fill="#ffffff99" stroke="none">
                    <path d="M305 2090 c3 -5 15 -10 26 -10 10 0 19 -7 19 -15 0 -9 -9 -15 -22
-15 -22 -1 -22 -1 -5 -15 13 -9 17 -20 12 -34 -6 -19 -2 -21 35 -21 25 0 39 4
35 10 -3 6 -15 10 -26 10 -18 0 -20 4 -14 33 4 17 7 34 7 37 1 25 -6 30 -38
30 -21 0 -33 -4 -29 -10z"/>
                    <path d="M450 2041 c0 -5 9 -11 21 -14 18 -5 19 -8 9 -27 -16 -30 0 -45 37
-35 28 7 28 7 5 16 -18 7 -22 14 -17 30 5 14 2 25 -6 30 -18 11 -49 11 -49 0z"/>
                    <path d="M575 2020 c-3 -4 7 -11 21 -14 21 -6 24 -10 14 -21 -6 -8 -9 -19 -5
-25 8 -13 65 -13 65 0 0 6 -9 10 -20 10 -14 0 -19 6 -17 22 1 15 -5 23 -25 29
-16 4 -30 4 -33 -1z"/>
                    <path d="M1315 2003 c-35 -19 -70 -47 -145 -117 -77 -72 -115 -84 -325 -106
-93 -9 -208 -28 -315 -50 -25 -5 -65 -12 -90 -16 -43 -6 -155 -39 -210 -62
-14 -5 -55 -22 -93 -37 -64 -26 -77 -37 -58 -49 4 -3 11 -36 15 -72 4 -37 21
-106 37 -153 17 -47 35 -104 41 -125 21 -75 93 -174 200 -275 56 -53 126 -112
153 -131 28 -19 52 -36 55 -39 3 -3 24 -23 46 -44 l41 -38 58 10 c32 6 66 18
76 27 16 15 23 13 86 -18 62 -30 75 -33 158 -32 73 1 97 5 128 22 48 28 53 28
194 -8 111 -29 359 -70 503 -84 36 -4 96 -3 134 2 52 7 76 5 96 -4 14 -8 51
-15 81 -17 30 -3 71 -12 91 -21 20 -8 58 -21 85 -28 26 -7 58 -20 71 -29 13
-10 36 -20 51 -24 16 -3 39 -17 51 -30 28 -30 83 -49 115 -41 39 10 132 131
145 188 5 27 10 55 10 62 0 9 18 15 51 18 70 7 81 21 73 92 -4 32 -13 64 -21
72 -12 12 -13 18 -3 29 10 12 7 30 -15 93 -15 42 -32 83 -38 91 -18 21 -122 9
-182 -22 -190 -98 -222 -110 -211 -82 3 8 2 15 -2 15 -12 -1 -38 -24 -44 -41
-3 -9 -32 -24 -65 -34 -40 -12 -67 -28 -86 -51 -28 -34 -60 -44 -73 -23 -3 6
6 23 21 39 28 29 27 50 -2 50 -9 0 -24 7 -34 16 -9 8 -41 19 -71 24 -29 5 -71
13 -92 19 -21 5 -90 11 -152 12 -109 2 -113 2 -144 -24 -29 -25 -60 -36 -60
-21 0 15 43 64 57 64 8 0 13 5 11 12 -7 20 -23 19 -44 -1 -12 -10 -36 -20 -55
-20 -108 -4 -152 -9 -219 -25 -86 -20 -133 -16 -184 17 -38 24 -53 47 -31 47
16 0 40 38 31 48 -4 3 -12 0 -18 -6 -7 -7 -24 -12 -39 -12 -28 0 -37 9 -113
113 -22 29 -57 66 -78 82 -25 19 -38 37 -38 53 0 31 -17 62 -35 62 -20 0 -19
-7 5 -37 11 -15 19 -28 17 -30 -2 -2 -24 6 -48 16 -80 36 -118 36 -170 3 -39
-25 -50 -39 -64 -82 -21 -64 -16 -131 15 -172 16 -22 19 -33 11 -41 -6 -6 -11
-29 -11 -52 0 -43 27 -89 108 -183 l43 -50 -55 -16 c-30 -9 -57 -16 -60 -16
-3 0 -22 17 -43 39 -21 21 -65 58 -98 81 -96 70 -244 214 -287 280 -56 85
-127 293 -134 395 l-6 80 68 27 c133 53 264 88 384 103 30 4 71 11 90 15 19 5
98 16 175 25 77 9 172 23 210 32 64 15 77 23 158 95 93 83 126 104 150 95 17
-6 123 -180 138 -227 6 -19 16 -45 22 -58 6 -12 11 -45 11 -73 1 -44 -3 -53
-26 -71 -16 -11 -28 -26 -28 -34 0 -20 7 -18 50 18 38 32 38 32 33 93 -3 33
-9 65 -13 70 -4 6 -13 28 -20 50 -11 34 -43 96 -101 194 -18 31 -60 81 -68 81
-3 -1 -19 -8 -36 -17z m-485 -696 c42 -15 74 -33 102 -55 43 -35 110 -108 124
-137 9 -16 49 -62 90 -101 96 -92 128 -102 240 -78 43 9 114 19 156 21 l77 4
3 -28 c3 -25 6 -28 41 -27 24 1 46 9 62 24 23 21 33 23 142 22 80 0 132 -6
162 -16 24 -9 55 -16 68 -16 20 0 50 -12 92 -38 3 -1 -5 -12 -17 -25 -12 -13
-22 -28 -22 -34 0 -20 39 -46 60 -40 12 3 59 -2 106 -11 46 -9 87 -13 90 -9
12 12 0 17 -65 28 -38 7 -61 16 -61 24 0 15 46 55 62 55 20 0 244 94 263 110
50 42 165 74 180 51 5 -9 11 -7 20 6 12 16 16 12 39 -42 34 -75 41 -105 27
-105 -6 0 -11 5 -11 10 0 6 -4 10 -10 10 -5 0 -10 -6 -10 -14 0 -19 -50 -36
-133 -46 -96 -11 -113 -31 -21 -24 38 3 84 10 102 14 25 7 34 5 39 -6 8 -22
26 -17 20 6 -3 11 -1 20 4 20 26 0 67 -116 48 -135 -6 -6 -13 -5 -19 5 -9 15
-25 7 -25 -13 0 -6 -16 -15 -35 -19 -19 -3 -61 -16 -93 -28 -52 -18 -66 -19
-140 -10 -117 14 -307 12 -412 -5 -49 -8 -145 -18 -213 -21 -118 -6 -161 -3
-342 28 -36 6 -72 12 -80 13 -8 1 -58 12 -111 25 l-96 23 -10 39 -10 38 103 0
c63 0 104 -4 104 -10 0 -5 -5 -10 -12 -10 -9 0 -9 -3 -1 -11 8 -8 18 -6 38 7
23 15 24 19 12 32 -11 10 -47 15 -133 18 -66 2 -127 7 -136 10 -24 7 -59 -28
-67 -68 -5 -22 -13 -34 -26 -36 -11 -2 -33 -9 -50 -17 -63 -28 -125 -28 -210
-1 -74 23 -86 31 -151 98 -106 109 -126 144 -108 191 5 13 11 12 42 -5 20 -12
46 -29 57 -39 34 -29 83 -49 120 -49 46 0 45 16 -2 25 -34 6 -145 73 -187 112
-56 54 -70 125 -38 196 30 66 90 90 162 64z m460 -543 c13 -33 13 -34 -4 -34
-20 0 -39 27 -32 45 8 23 25 18 36 -11z m1295 -131 c33 -4 73 -6 89 -4 27 2
28 1 21 -26 -3 -15 -12 -31 -18 -35 -9 -5 -9 -10 0 -19 10 -10 18 0 38 44 14
34 31 57 40 57 12 0 14 -7 9 -27 -13 -60 -19 -70 -71 -129 l-53 -62 -38 12
c-20 6 -50 19 -67 28 -16 9 -50 28 -75 41 -28 16 -45 32 -45 44 0 12 -9 19
-27 21 -16 2 -28 7 -28 11 0 12 -49 20 -56 10 -3 -5 7 -14 22 -19 15 -6 24
-13 21 -16 -10 -10 -78 20 -73 32 6 15 -21 27 -29 14 -7 -12 -81 -12 -110 -1
-18 7 -16 9 12 15 18 4 42 5 53 1 12 -4 27 -2 34 4 21 18 220 20 351 4z"/>
                    <path d="M835 1120 c-15 -46 102 -182 188 -220 54 -24 117 -36 117 -22 0 6
-15 14 -32 17 -56 12 -125 55 -181 114 -67 70 -72 78 -56 97 10 13 10 17 -2
25 -21 13 -27 11 -34 -11z"/>
                    <path d="M2828 974 c-8 -7 3 -54 13 -54 4 0 11 5 14 10 3 6 1 10 -5 10 -7 0
-10 7 -7 15 6 14 -6 29 -15 19z"/>
                    <path d="M2844 799 c3 -8 9 -22 12 -31 4 -10 10 -18 15 -18 11 0 12 14 2 24
-5 4 -8 13 -8 19 0 5 -6 12 -14 15 -9 3 -11 0 -7 -9z"/>
                    <path d="M1978 787 c-40 -7 -58 -15 -58 -25 0 -11 7 -13 28 -8 15 3 65 15 112
25 l85 19 -55 0 c-30 -1 -81 -5 -112 -11z"/>
                    <path d="M2430 560 c0 -11 65 -43 92 -45 10 -1 26 -9 35 -18 10 -8 30 -20 44
-25 23 -9 29 -6 52 20 29 33 33 43 16 53 -5 4 -15 -7 -22 -24 -6 -17 -15 -31
-19 -31 -22 0 -57 22 -63 40 -5 15 -10 18 -23 11 -11 -6 -27 -3 -51 10 -39 21
-61 24 -61 9z"/>
                    <path d="M730 1980 c-10 -6 -11 -10 -3 -10 9 0 10 -7 3 -26 -12 -31 -6 -44 21
-44 21 0 26 16 7 22 -10 4 -10 10 -1 30 16 35 4 48 -27 28z"/>
                    <path d="M1418 1559 c-1 -28 0 -53 4 -55 10 -7 15 7 23 59 6 38 5 47 -8 47
-11 0 -16 -14 -19 -51z"/>
                    <path d="M1287 1583 c-8 -13 4 -63 15 -63 5 0 18 -10 28 -22 10 -13 22 -20 26
-15 10 10 -17 57 -33 57 -9 0 -13 8 -11 22 3 21 -15 37 -25 21z"/>
                    <path d="M1146 1541 c-9 -14 21 -84 33 -77 5 3 4 20 -3 41 -15 41 -22 50 -30
36z"/>
                    <path d="M1596 1534 c-43 -24 -18 -38 27 -15 20 10 33 21 30 25 -10 9 -25 7
-57 -10z"/>
                    <path d="M1623 1487 c-24 -11 -43 -27 -43 -34 0 -10 14 -6 48 13 26 15 51 31
57 36 17 15 -20 7 -62 -15z"/>
                    <path d="M1770 1495 c-10 -12 -10 -18 0 -30 11 -13 8 -16 -19 -21 -34 -7 -42
-24 -12 -24 20 0 91 37 91 47 0 3 -9 3 -21 0 -13 -3 -19 -1 -16 6 2 7 13 13
25 15 12 2 22 8 22 13 0 15 -56 10 -70 -6z"/>
                    <path d="M1220 1482 c0 -28 10 -52 22 -52 14 0 5 63 -9 68 -8 2 -13 -5 -13
-16z"/>
                    <path d="M997 1483 c-11 -10 -8 -61 4 -68 14 -9 15 -7 22 38 5 35 -7 50 -26
30z"/>
                    <path d="M1342 1449 c-34 -34 -42 -59 -17 -59 8 0 15 6 15 13 0 8 11 24 25 37
25 24 32 40 17 40 -5 0 -23 -14 -40 -31z"/>
                    <path d="M1447 1455 c-20 -14 -37 -30 -37 -35 0 -22 18 -15 60 21 50 44 35 53
-23 14z"/>
                    <path d="M1069 1443 c19 -35 39 -58 46 -51 10 10 -24 68 -41 68 -11 0 -12 -4
-5 -17z"/>
                    <path d="M1655 1448 c-27 -14 -75 -60 -75 -70 0 -4 11 -8 25 -8 18 0 25 5 25
18 0 10 11 25 25 32 14 7 25 19 25 27 0 15 0 15 -25 1z"/>
                    <path d="M1910 1444 c0 -12 6 -15 23 -10 12 3 25 6 30 6 4 0 7 5 7 10 0 6 -13
10 -30 10 -21 0 -30 -5 -30 -16z"/>
                    <path d="M2080 1430 c-12 -7 -12 -10 2 -15 9 -4 25 -5 35 -3 17 4 16 5 -3 15
-12 7 -26 8 -34 3z"/>
                    <path d="M1241 1404 c-22 -29 -29 -78 -9 -72 6 2 13 15 15 28 2 13 10 31 18
40 8 9 15 20 15 23 0 15 -20 5 -39 -19z"/>
                    <path d="M1915 1416 c-37 -12 -48 -33 -15 -29 39 5 110 27 110 35 0 11 -47 8
-95 -6z"/>
                    <path d="M174 1384 c8 -30 22 -51 31 -43 8 9 -11 63 -24 67 -11 4 -12 -2 -7
-24z"/>
                    <path d="M1453 1387 c-28 -12 -48 -64 -32 -83 14 -17 30 -9 23 11 -9 22 15 55
40 55 33 0 58 -32 50 -64 -7 -31 10 -35 26 -6 8 15 7 27 -5 50 -9 16 -17 30
-18 30 -1 0 -16 4 -32 9 -18 5 -39 4 -52 -2z"/>
                    <path d="M1708 1380 c-41 -22 -52 -35 -43 -51 5 -7 14 -4 29 8 11 10 33 25 49
33 28 14 36 30 15 30 -7 -1 -30 -10 -50 -20z"/>
                    <path d="M1131 1377 c-6 -8 -14 -29 -17 -46 -6 -29 -4 -33 12 -29 13 2 18 10
16 25 -2 12 2 31 8 43 12 22 -1 27 -19 7z"/>
                    <path d="M950 1369 c0 -18 32 -79 41 -79 13 0 11 12 -6 54 -14 34 -35 49 -35
25z"/>
                    <path d="M2068 1367 c-38 -7 -58 -15 -58 -24 0 -11 9 -12 38 -8 51 9 102 27
102 37 0 9 -4 9 -82 -5z"/>
                    <path d="M1320 1337 c0 -31 13 -77 22 -77 14 0 5 83 -9 88 -7 2 -13 -3 -13
-11z"/>
                    <path d="M1850 1335 c-19 -7 -44 -16 -54 -19 -15 -5 -17 -9 -8 -18 9 -9 24 -6
62 12 27 13 50 27 50 32 0 11 -8 10 -50 -7z"/>
                    <path d="M1030 1306 c0 -37 15 -55 32 -38 6 6 6 12 -1 16 -6 4 -11 18 -11 32
0 13 -4 24 -10 24 -5 0 -10 -15 -10 -34z"/>
                    <path d="M1220 1314 c0 -14 42 -74 52 -74 10 0 9 5 -14 52 -11 24 -38 39 -38
22z"/>
                    <path d="M1665 1302 c-30 -7 -65 -33 -65 -48 0 -19 10 -17 40 6 14 11 30 20
37 20 14 0 26 17 16 23 -5 2 -17 2 -28 -1z"/>
                    <path d="M1923 1288 c-51 -20 -69 -38 -38 -38 20 0 105 42 105 52 0 11 -8 10
-67 -14z"/>
                    <path d="M220 1281 c0 -24 76 -161 97 -174 7 -4 13 -14 13 -22 0 -17 49 -57
61 -49 5 3 -10 29 -34 57 -23 29 -51 68 -61 87 -56 110 -76 137 -76 101z"/>
                    <path d="M2183 1288 c2 -7 11 -13 20 -12 10 0 33 1 53 2 54 3 30 22 -27 22
-36 0 -49 -4 -46 -12z"/>
                    <path d="M1131 1268 c1 -18 66 -71 81 -65 8 2 -2 18 -26 41 -42 38 -56 44 -55
24z"/>
                    <path d="M2075 1253 c-11 -2 -30 -6 -42 -9 -29 -6 -30 -24 -2 -24 31 0 99 22
99 32 0 8 -20 9 -55 1z"/>
                    <path d="M1715 1233 c-38 -20 -38 -20 -31 -31 6 -11 80 20 91 38 9 15 -26 11
-60 -7z"/>
                    <path d="M1046 1233 c-3 -3 -6 -9 -6 -13 0 -7 92 -60 104 -60 17 0 2 21 -31
41 -21 13 -43 27 -49 31 -6 4 -14 5 -18 1z"/>
                    <path d="M1795 1198 c-49 -25 -48 -24 -41 -37 8 -13 96 30 96 47 0 16 -8 15
-55 -10z"/>
                    <path d="M2235 1200 c-27 -10 -60 -19 -72 -19 -13 -1 -23 -5 -23 -11 0 -16 45
-12 100 10 28 11 69 20 90 20 22 0 40 5 40 10 0 16 -80 9 -135 -10z"/>
                    <path d="M1427 1176 c-3 -8 -17 -16 -32 -18 -30 -4 -34 -22 -6 -26 29 -5 61
16 61 38 0 23 -15 27 -23 6z"/>
                    <path d="M1888 1178 c-28 -10 -35 -22 -19 -32 10 -7 71 25 71 37 0 9 -18 8
-52 -5z"/>
                    <path d="M1998 1153 c-17 -4 -24 -24 -12 -35 7 -7 64 24 64 35 0 7 -23 8 -52
0z"/>
                    <path d="M2370 1150 c0 -10 41 -30 58 -30 10 1 -39 40 -49 40 -5 0 -9 -5 -9
-10z"/>
                    <path d="M2065 1121 c-3 -5 -1 -13 5 -16 14 -9 70 4 70 16 0 12 -67 12 -75 0z"/>
                    <path d="M2308 1113 c-21 -2 -38 -9 -38 -15 0 -13 99 -3 114 12 10 10 0 11
-76 3z"/>
                    <path d="M2178 1083 c-27 -4 -37 -17 -20 -26 12 -7 72 13 72 23 0 10 -3 10
-52 3z"/>
                    <path d="M1314 1046 c-14 -11 -16 -18 -8 -26 18 -18 49 -7 52 18 4 26 -15 29
-44 8z"/>
                    <path d="M2235 1039 c-4 -6 -5 -13 -2 -16 9 -9 87 8 81 18 -7 13 -71 11 -79
-2z"/>
                    <path d="M2425 1040 c-3 -5 -17 -10 -31 -10 -15 0 -24 -6 -24 -16 0 -10 6 -14
18 -10 9 3 29 8 45 12 15 3 27 12 27 20 0 16 -26 19 -35 4z"/>
                    <path d="M410 1000 c0 -5 13 -16 30 -25 16 -8 38 -28 47 -43 19 -29 98 -112
107 -112 33 0 -84 148 -140 176 -31 16 -44 18 -44 4z"/>
                    <path d="M2296 991 c-3 -5 10 -11 30 -13 34 -4 50 3 37 16 -10 9 -61 7 -67 -3z"/>
                    <path d="M620 807 c0 -8 17 -22 38 -33 20 -10 44 -25 54 -32 22 -18 33 1 16
28 -7 11 -22 20 -33 20 -12 0 -30 7 -41 15 -24 18 -34 19 -34 2z"/>
                </g>
            </svg>

        </div>


    const [rect, setRect] = createSignal({
        height: window.innerHeight,
        width: window.innerWidth
    });

    const handler = (event: Event) => {
        setRect({ height: window.innerHeight, width: window.innerWidth });
    };

    onMount(() => {
        window.addEventListener('resize', handler);
    });

    onCleanup(() => {
        window.removeEventListener('resize', handler);
    })


    const [allowedResource, {  }] = createResource(() => {
        return authService().allowedToWatch(params.user).catch(() => false);
    });

    const allowed = () => {
        return allowedResource();
    };


    const fetcher = (name: string) => statService().getViewers(name);

    const [vc, { refetch }] = createResource(() => params.user, fetcher);

    const interval = 10000;
    const i = setInterval(() => refetch(), interval);
    onCleanup(() => clearInterval(i));

    const getViewCount = () => {
        let count = vc();
        return count;
    };

    onMount(() =>{
        chatService().setRoom(params.user);
    })

    onCleanup(() => {
        chatService().setRoom("fluss");
    })

    createEffect(() => {
        if (chatService().state !== WebSocket.OPEN) {
            input.disabled = true;
        } else {
            input.disabled = false;
        }
    })

    createEffect(() => {
        chatService().chatmessages
        aside.scrollTop = aside.scrollHeight;
    })

    createEffect(() => {
        rect()
        aside.scrollTop = aside.scrollHeight;
    })

    function send(  ) {
        if (event.key === 'Enter' && input.value.length > 0) {
            chatService().send(input.value);
            input.value = ""
        }
    }

    var stringToColour = function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    }

    return (
        <>
            <div class="flex-grow mmd:max-h-[calc(100vw/(16/9))] flex">
                <Show when={(authService().token !== 'uninit') || allowed()} fallback={loginFallback}>
                    <div use:viewCounter={[vc, params.user]}></div>
                    <div class="flex-grow justify-center flex mmd:max-h-[calc(100vw/(16/9))] flex-1 flex">
                        <Show when={!allowedResource.loading && allowed()} fallback={whitelistFallback}>
                            <Show when={getViewCount() !== -500 && authService().token !== 'loading'}
                                  fallback={offline}>
                                <Player
                                    class="flex items-stretch flex-1"
                                    style={css}
                                    url={import.meta.env.VITE_WS_PROTOCOl + `${endpoint}/ws/${params.user}`}
                                    name={params.user}
                                    instance={params.user} autoplay={true}
                                    scroll={true}
                                    token={authService().token}
                                    user={authService().user.username}
                                    viewcount={vc}
                                    id="player">
                                </Player>
                            </Show>
                        </Show>
                    </div>
                </Show>
            </div>
            <aside class="flex flex-col mmd:w-[350px] mmd:w-[100%] mmd:flex-1" aria-label="Sidebar"  style={{'max-height': 'calc(100vh - (160px))'}}>
                <div class="m-2 px-3 bg-neutral rounded flex flex-row">
                        <For each={chatService().viewers?.sort()}>
                            {(viewer) =>
                                <>
                                    <button onmouseleave={() => document.getElementById("tooltip-default_" + viewer).classList.add("invisible") } onmouseenter={() => document.getElementById("tooltip-default_" + viewer).classList.remove("invisible") } type="button" data-tooltip-target={"tooltip-default_" + viewer} class="circle" style={{ 'background-color' : stringToColour(viewer.includes("_Guest") == false ? viewer.split("_")[1][0] : viewer ) }}>
                                        <span class="within_center">{viewer.split("_")[1][0].toUpperCase()}</span>
                                    </button>
                                    <div id={"tooltip-default_" + viewer} role="tooltip"  class="invisible inline-block absolute z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm transition-opacity duration-300 tooltip dark:bg-gray-700" style={{'transform': 'translateY(28px)'}}>
                                        {viewer.split("_")[1]}
                                        <div class="tooltip-arrow" data-popper-arrow></div>
                                    </div>
                                </>
                            }
                        </For>
                </div>
                <div ref={aside} class="m-2 px-3 bg-neutral rounded overflow-y-auto flex-grow flex flex-col">
                        <For each={chatService().chatmessages}>
                            {(message) =>
                                <div>
                                    <div
                                       class="overflow-hidden flex items-center text-base font-normal text-base-content rounded-lg dark:text-white dark:hover:bg-gray-700">
                                        <svg aria-hidden="true"
                                             class="relative top-[2.5px] min-w-[20px] max-w-[20px] w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                                             fill="currentColor" viewBox="0 0 20 20"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                        </svg>
                                        <span class="ml-3 break-words">{message}</span>
                                    </div>
                                </div>
                            }
                        </For>
                </div>
                <div class="flex align m-2">
                    <input class="flex-1" ref={input} onkeydown={send} class="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="shitpost" type="text" placeholder="...">
                    </input>
                    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" innerText="🔁" onclick={chatService().reconnect}></button>
                </div>
            </aside>
        </>
    );
};

export default Stream;
