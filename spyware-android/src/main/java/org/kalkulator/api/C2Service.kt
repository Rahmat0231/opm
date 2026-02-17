package org.kalkulator.api

import org.kalkulator.model.CheckinRequest
import org.kalkulator.model.CheckinResponse
import org.kalkulator.model.StatusRequest
import org.kalkulator.model.StatusResponse
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface C2Service {
    @POST("api/checkin")
    fun checkin(@Body request: CheckinRequest): Call<CheckinResponse>

    @POST("api/status")
    fun sendStatus(@Body request: StatusRequest): Call<StatusResponse>
}
