// Supermarket locations from OpenStreetMap (via Nominatim), hardcoded so the Stores page works without a
// live lookup. Only Los Angeles-area Ralphs and Vons are included; the list is partial.
// Each entry: brand, address, lat, lon.
const chainStores = [
  {
    "brand": "Ralphs",
    "address": "Ralphs, 19781",
    "lat": 34.276238,
    "lon": -118.563645
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 11727",
    "lat": 34.035025,
    "lon": -118.44928
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 14049",
    "lat": 34.149868,
    "lon": -118.439256
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 4311",
    "lat": 33.984258,
    "lon": -118.443198
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 5245",
    "lat": 33.979007,
    "lon": -118.371597
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 14440",
    "lat": 34.171425,
    "lon": -118.447123
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 10309",
    "lat": 34.052508,
    "lon": -118.417821
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 20060",
    "lat": 34.170083,
    "lon": -118.570247
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 18010",
    "lat": 34.263334,
    "lon": -118.524167
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 12057",
    "lat": 34.04496,
    "lon": -118.467012
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 670",
    "lat": 34.060063,
    "lon": -118.308529
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 22915",
    "lat": 34.187192,
    "lon": -118.62637
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 8824",
    "lat": 33.956327,
    "lon": -118.397763
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 7257",
    "lat": 34.098686,
    "lon": -118.348435
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 17250",
    "lat": 34.206895,
    "lon": -118.50885
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 21909",
    "lat": 34.169711,
    "lon": -118.603991
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 3410",
    "lat": 34.068474,
    "lon": -118.290577
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 10900",
    "lat": 34.164338,
    "lon": -118.367813
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, Balboa Boulevard",
    "lat": 34.256644,
    "lon": -118.501278
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 12842",
    "lat": 34.144067,
    "lon": -118.413137
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 7221",
    "lat": 34.201947,
    "lon": -118.432156
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 12921",
    "lat": 34.165727,
    "lon": -118.414417
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 1730",
    "lat": 33.959284,
    "lon": -118.30789
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 22333",
    "lat": 34.201972,
    "lon": -118.613558
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 1416",
    "lat": 34.141759,
    "lon": -118.233313
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 10455",
    "lat": 34.260583,
    "lon": -118.326733
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 260",
    "lat": 34.07002,
    "lon": -118.343635
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 645",
    "lat": 34.04559,
    "lon": -118.260835
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 11922",
    "lat": 33.924807,
    "lon": -118.291016
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 8325",
    "lat": 34.222619,
    "lon": -118.397751
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 1233",
    "lat": 34.093733,
    "lon": -118.344337
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 5429",
    "lat": 34.102296,
    "lon": -118.308136
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 910",
    "lat": 33.999028,
    "lon": -118.461387
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 8701",
    "lat": 33.958182,
    "lon": -118.418489
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 17840",
    "lat": 34.162648,
    "lon": -118.521478
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 10861",
    "lat": 34.063332,
    "lon": -118.443946
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 2600",
    "lat": 34.031765,
    "lon": -118.290833
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 5601",
    "lat": 34.062761,
    "lon": -118.350983
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 4760",
    "lat": 34.047791,
    "lon": -118.339549
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 21431",
    "lat": 34.257992,
    "lon": -118.598361
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 16940",
    "lat": 34.25668,
    "lon": -118.501282
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 10901",
    "lat": 34.140053,
    "lon": -118.367946
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 11361",
    "lat": 34.026018,
    "lon": -118.433347
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 5080",
    "lat": 34.020445,
    "lon": -118.354735
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 6290",
    "lat": 33.760978,
    "lon": -118.116143
  },
  {
    "brand": "Ralphs",
    "address": "Ralphs, 1930",
    "lat": 33.79213,
    "lon": -118.141419
  },
  {
    "brand": "Vons",
    "address": "Vons, 1260",
    "lat": 33.890961,
    "lon": -118.298013
  },
  {
    "brand": "Vons",
    "address": "Vons, 13730",
    "lat": 34.308345,
    "lon": -118.433186
  },
  {
    "brand": "Vons",
    "address": "Vons, 16830",
    "lat": 34.2709,
    "lon": -118.498935
  },
  {
    "brand": "Vons",
    "address": "Vons, 3461",
    "lat": 34.069943,
    "lon": -118.290904
  },
  {
    "brand": "Vons",
    "address": "Vons, 311",
    "lat": 34.129439,
    "lon": -118.258622
  },
  {
    "brand": "Vons",
    "address": "Vons, 4030",
    "lat": 33.999188,
    "lon": -118.428933
  },
  {
    "brand": "Vons",
    "address": "Vons, 4520",
    "lat": 34.097068,
    "lon": -118.287993
  },
  {
    "brand": "Vons",
    "address": "Vons, 7789",
    "lat": 34.259194,
    "lon": -118.301184
  },
  {
    "brand": "Vons",
    "address": "Vons, 4033",
    "lat": 34.144649,
    "lon": -118.396176
  },
  {
    "brand": "Vons",
    "address": "Vons, 1342",
    "lat": 34.079488,
    "lon": -118.261304
  },
  {
    "brand": "Vons",
    "address": "Vons, 1221",
    "lat": 33.732938,
    "lon": -118.293589
  },
  {
    "brand": "Vons",
    "address": "Vons, 301",
    "lat": 34.1548,
    "lon": -118.346569
  },
  {
    "brand": "Vons",
    "address": "Vons, 9119",
    "lat": 34.236055,
    "lon": -118.537755
  },
  {
    "brand": "Vons",
    "address": "Vons, 1430",
    "lat": 34.050467,
    "lon": -118.366244
  },
  {
    "brand": "Vons",
    "address": "Vons, 1440",
    "lat": 33.72307,
    "lon": -118.310851
  },
  {
    "brand": "Vons",
    "address": "Vons, 17380",
    "lat": 34.039275,
    "lon": -118.553988
  },
  {
    "brand": "Vons",
    "address": "Vons, 10321",
    "lat": 34.258004,
    "lon": -118.468378
  },
  {
    "brand": "Vons",
    "address": "Vons, 9860",
    "lat": 34.030191,
    "lon": -118.401424
  },
  {
    "brand": "Vons",
    "address": "Vons, 20440",
    "lat": 34.256611,
    "lon": -118.578624
  },
  {
    "brand": "Vons",
    "address": "Vons, 6571",
    "lat": 33.969309,
    "lon": -118.405441
  },
  {
    "brand": "Vons",
    "address": "Vons, 18439",
    "lat": 34.169015,
    "lon": -118.5342
  },
  {
    "brand": "Vons",
    "address": "Vons, 19333",
    "lat": 34.187716,
    "lon": -118.554467
  },
  {
    "brand": "Vons",
    "address": "Vons, 4550",
    "lat": 33.840992,
    "lon": -118.182791
  },
  {
    "brand": "Vons",
    "address": "Vons, 5949",
    "lat": 33.811879,
    "lon": -118.115477
  },
  {
    "brand": "Vons",
    "address": "Vons, 4226",
    "lat": 33.835016,
    "lon": -118.115227
  },
  {
    "brand": "Vons",
    "address": "Vons, 600",
    "lat": 33.768887,
    "lon": -118.184376
  },
  {
    "brand": "Vons",
    "address": "Vons, 1820",
    "lat": 33.790331,
    "lon": -118.137354
  },
  {
    "brand": "Vons",
    "address": "Vons, 3900",
    "lat": 33.759817,
    "lon": -118.147128
  },
  {
    "brand": "Vons",
    "address": "Vons, 7311",
    "lat": 34.136221,
    "lon": -118.189512
  },
  {
    "brand": "Vons",
    "address": "Vons, 2355",
    "lat": 34.147622,
    "lon": -118.102104
  },
  {
    "brand": "Vons",
    "address": "Vons, 155",
    "lat": 34.136752,
    "lon": -118.153509
  },
  {
    "brand": "Vons",
    "address": "Vons, 1311",
    "lat": 34.026563,
    "lon": -118.489841
  },
  {
    "brand": "Vons",
    "address": "Vons, 1515",
    "lat": 34.017415,
    "lon": -118.490201
  },
  {
    "brand": "Vons",
    "address": "Vons, 8010",
    "lat": 33.867264,
    "lon": -117.751544
  },
  {
    "brand": "Vons",
    "address": "Vons, 5600",
    "lat": 33.84979,
    "lon": -117.791662
  },
  {
    "brand": "Vons",
    "address": "Vons, 130",
    "lat": 33.835057,
    "lon": -117.914579
  },
  {
    "brand": "Vons",
    "address": "Vons, 561",
    "lat": 34.154937,
    "lon": -118.24482
  },
  {
    "brand": "Vons",
    "address": "Vons, 3650",
    "lat": 33.698076,
    "lon": -117.887087
  },
  {
    "brand": "Vons",
    "address": "Vons, 500",
    "lat": 33.960254,
    "lon": -118.349169
  },
  {
    "brand": "Vons",
    "address": "Vons, 24325",
    "lat": 33.80516,
    "lon": -118.330541
  },
  {
    "brand": "Vons",
    "address": "Vons, 1212",
    "lat": 33.853921,
    "lon": -118.380223
  },
  {
    "brand": "Vons",
    "address": "Vons, 4705",
    "lat": 33.838403,
    "lon": -118.363512
  },
  {
    "brand": "Vons",
    "address": "Vons, 8891",
    "lat": 33.658412,
    "lon": -117.973145
  },
  {
    "brand": "Vons",
    "address": "Vons, 5922",
    "lat": 33.728574,
    "lon": -118.024953
  }
]

export default chainStores
