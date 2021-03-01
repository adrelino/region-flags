#!/usr/bin/env python3

import requests
from regions import load_regions, load_subregions, load_aliases

def load_region_wp_urls(region_keys_names):
    aliases_wp = load_aliases("data/ALIASES-WP")
    urls = {}

    for region_key, region_name in region_keys_names.items():

        # Apply Wikipedia-specific mappings
        has_name_alias = region_name in aliases_wp
        region_name_original = region_name
        region_name = aliases_wp.get(region_key, aliases_wp.get(region_name, region_name))
        region_name = region_name.replace(' ', '_')
        prefix = "Flag_of_"
        url_template = "https://commons.wikimedia.org/wiki/File:{}{}.svg"

        #Swiss mappings
        if len(region_key)> 2 and region_key.startswith("CH"):
            region_name = "Canton_of_"+region_name
        
        #French mappings based on this list https://en.wikipedia.org/wiki/Departments_of_France
        if len(region_key)> 2 and region_key.startswith("FR"):
            prefixes = [prefix, 
                    "Drapeau_fr_département_", # ["Aisne","Allier","Alpes-de-Haute-Provence","Ardennes","Ariège","Aube","Aude",...]:
                    "Drapeau_département_fr_"]  # ["Drôme","Haute-Loire"]
            if not has_name_alias:
                for p in prefixes:
                    r = requests.head(url_template.format(p,region_name))
                    if r.status_code != 404:
                        prefix = p
                        break
            if region_name.startswith("Proposed") or region_key in ["FR-17","FR-88"]:
                prefix=""
            if region_key in["FR-29","FR-64","FR-66","FR-68"]:
                prefix="Drapeau_"
            parts=region_name.split(".")
            if len(parts)==2 and parts[1] in ["jpg","gif","png"]:
                region_name = region_name_original
                prefix="Blason_département_fr_"  #Fallback to "Blason" for the 5 departments without svg flag

        urls[region_key] = url_template.format(prefix, region_name)

    return urls


def load_region_key_names():

    aliases = load_aliases("data/ALIASES")
    regions = load_regions()
    regions.update(load_subregions())

    region_keys_names = {}
    region_keys = sorted(regions.keys())

    for k in region_keys:

        # If this uses another flag, skip
        if k in aliases:
            continue

        if 'Description' in regions[k].keys():
            region_keys_names[k] = regions[k]['Description']
        else:
            region_keys_names[k] = regions[k]['Subdivision name']

    return region_keys_names


if __name__ == '__main__':
    REGION_URLS = load_region_wp_urls(load_region_key_names())
    SORTED_KEYS = sorted(REGION_URLS.keys())

    for key in SORTED_KEYS:
        print("%s    %s" % (key, REGION_URLS[key]))
