<?php

namespace App\Enums;

enum ClientType: string
{
    case Standard = 'standard';
    case Conversion = 'conversion';
    case MultiCampaign = 'multi_campaign';
}
